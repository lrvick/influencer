from django.conf.urls.defaults import *
from django.conf import settings

import os.path

urlpatterns = patterns('',
  (r'^$', 'django.views.generic.simple.direct_to_template', {'template':'main.html'}),
  (r'^feeds/', include('kral.urls')),
)

if settings.DEBUG:
    media = os.path.join(os.path.dirname(__file__), 'static')
    urlpatterns += patterns('',
        (r'^static/(?P<path>.*)$', 'django.views.static.serve',
        {'document_root': media}),)

# vim: ai ts=4 sts=4 et sw=4
