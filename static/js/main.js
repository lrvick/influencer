var plugins = ["facebook", "twitter"];
var renderer = new EJS({url:"/static/js/result.ejs"});

var timeupdate = 0;

function max(a, b){return a > b ? a : b;}
function min(a, b){return a > b ? b : a;}
function increment(selector, amount, kwargs){
	e = $(selector)
	i = parseInt(e.html()) + amount;
	if(kwargs && kwargs.max){i = max(i, kwargs.max);}
	if(kwargs && kwargs.min){i = min(i, kwargs.min);}
	e.html(i);
	return i
}

function update(){
	function do_display(plugin, item, t){
		pk = item.pk;
		id = "result-pk-"+plugin+"-"+pk;
			if($("#"+id).length > 0){return 0;}
			item.plugin = plugin;
		item.id = id;
		d = item.fields.date;
		if(!d){d = item.fields.created_time;}
		d = new Date(d);
		item.time = d.getFullYear()+'-'+(d.getMonth()+1)+'-'+
				d.getDate()+'T'+d.getHours()+':'+
				d.getMinutes()+':'+d.getSeconds()+'Z';
		item.time_text = $.timeago(item.time);
		console.log(item.time, "|", d.toString());
		$(t).prepend(renderer.render(item));
		$("#"+id).slideDown("slow");
		$(t).children().removeClass("gap")
			.slice(9,10).addClass("gap");
		$(t).children().slice(50).remove();
		return 1;
	}
	function process_results(plugin, t){
		return function(data, textStatus, xhr){
            		changes = 0;
			for(i=data.length-1; i >=0; --i){
				changes += do_display(plugin, data[i], t);
			}
			left = $(t).hasClass("left");
			increment(left?"#total-left":"#total-right", changes)
			selector = left?"#numbers .left .":"#numbers .right .";
			increment(selector+plugin+"-count .counter", changes);
			increment(left?"#vessel-left-count":
						"#vessel-right-count", changes,
							{min: 20})
		}
	}
	function call_updates(){
		q = $(this).attr("q");
		if(!q){return;}
		for(i = 0; i < plugins.length; ++i){
			url = "/feeds/"+plugins[i]+"/"+q+".json";
			$.getJSON(url, process_results(plugins[i], this));
		}
		left = $(this).hasClass("left");
		selector = left?"#vessel-left-count":"#vessel-right-count";
		count = increment(selector, -2, {max: 0});
        	height = 8*min(count, 15)+10;
        	selector = left?"#fluid-left":"#fluid-right";
        	//height of the tube is 138
		$(selector).animate({height:height+"px", 
                            marginTop:(140-height)+"px"}, 1000);
    	}
	function update_time(){
		$(this).html($.timeago($(this).attr("title")));
	}
	$(".resultlist").each(call_updates);
	++timeupdate;
	if(timeupdate > 4){
		timeupdate = 0;
		$(".time").each(update_time);
	}
}

//Sets the "q" attribute on the two search queries.
function form_button(){
	searches = [$("#input-left").val(), $("#input-right").val()]
	if(!searches[0]||!searches[1]){
		alert("Please fill both search boxes.");
		return;
	}
	for(i = 0; i < searches.length; ++i){
		searches[i] = searches[i].toLowerCase();
		if(!searches[i].match('^[a-z0-9]*$')){
			alert('Single words with no punctuation only, please');
			return;
		}
	}
	$("#result-left").attr("q", searches[0]);
	$("#result-right").attr("q", searches[1]);
	$(".counter").html("0");
    	$(".resultlist").each(function(){$(this).children().remove();});
}

//Adds handler for search button, and starts the updater running ever 2.5s
$(document).ready(function(){
	$("#form button").click(form_button);
    	$(".resultlist").attr("count", 0);
	setInterval(update, 2500);
});
