import httplib,urlparse,pycurl,json,time,re,sys,time,datetime,os,threading
from celery.task.base import Task
from django.conf import settings
from models import *
from kral.models import *
from tasks import *
from kral.tasks import *
from celery.registry import tasks

class Twitter(Task):
    def run(self,query, **kwargs):
        self.buffer = ""
        self.stream = pycurl.Curl()
        self.stream.setopt(pycurl.USERPWD, "%s:%s" % (settings.TWITTER_USER, settings.TWITTER_PASS))
        self.stream.setopt(pycurl.URL, "http://stream.twitter.com/1/statuses/filter.json?track=%s" % (query))
        self.stream.setopt(pycurl.WRITEFUNCTION, self.on_receive)
        self.stream.perform()
    def on_receive(self, data):
        self.buffer += data
        if data.endswith("\r\n") and self.buffer.strip():
            ProcessTweet.delay(self.buffer)
            self.buffer = ""

class ProcessTweet(Task):
    def run(self, data, **kwargs):
        logger = self.get_logger(**kwargs)
        content = json.loads(data)
        user_id = content["user"].get('id_str', None)
        urls = content['entities']['urls']
        if user_id is not None:
            for url in urls: #this sin't defined at this point
                if url['expanded_url']:
                    ExpandURL.delay(url['expanded_url'])
                else:
                    ExpandURL.delay(url['url'])
            try:
                twitter_user = TwitterUser.objects.get(user_id=user_id)
                twitter_user.total_tweets = content["user"]["statuses_count"],
                twitter_user.listed = content["user"]["listed_count"],
                twitter_user.following = content["user"]["friends_count"],
                twitter_user.followers = content["user"]["followers_count"],
                twitter_user.save()
                logger.info("Updated profile for Twitter user %s" % (content["user"]["screen_name"]))
            except:
                twitter_user = TwitterUser (
                    user_id = user_id,
                    user_name = content["user"]["screen_name"],
                    real_name = content["user"]["name"],
                    #location = content["user"]["location"],
                    avatar = content["user"]["profile_image_url"],
                    date = datetime.datetime.fromtimestamp(time.mktime(time.strptime(content["user"]["created_at"], '%a %b %d %H:%M:%S +0000 %Y'))),
                    language = content["user"]["lang"],
                    total_tweets = content["user"]["statuses_count"],
                    #time_zone = content["user"]["time_zone"],
                    listed = content["user"]["listed_count"],
                    following = content["user"]["friends_count"],
                    followers = content["user"]["followers_count"],
                    geo_enabled = content["user"]["geo_enabled"],
                    contributors_enabled = content["user"]["contributors_enabled"],
                    #utc_offset = content["user"]["utc_offset"],
                )
                twitter_user.save()
                logger.info("Saved new profile Twitter user %s" % (content["user"]["screen_name"]))
            try:
                twitter_user = TwitterUser.objects.get(user_id=user_id)
                twitter_tweet = TwitterTweet (
                    date = datetime.datetime.fromtimestamp(time.mktime(time.strptime(content["created_at"], '%a %b %d %H:%M:%S +0000 %Y'))),
                    tweet_id = content["id_str"],
                    user_id = TwitterUser.objects.get(user_id=content["user"]["id_str"]),
                    text = content["text"],
                    #place = content["user"]["place"],
                    truncated = content['truncated'], 
                    geo = content["user"]["location"],
                    contributors = content["contributors"],
                    #retweeted = content['retweeted'], 
                    #irt_status_id = content['in_reply_to_status_id'],
                    #irt_status_name = content['in_reply_to_status_name'],
                    #retweet_count = content['retweet_count'], 
                    #geo = content['geo'], 
                )
                twitter_tweet.save()
                logger.info("Saved new tweet: %s" % (content["id_str"]))
                return True
            except:
                logger.info("ERROR - Unable to save tweet %s" % (content["id_str"]))

#vim: ai ts=4 sts=4 et sw=4
