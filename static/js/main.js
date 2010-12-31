var plugins = ["facebook", "twitter"];
var renderer = new EJS({url:"/static/js/result.ejs"});

function max(a, b){return a > b ? a : b;}
function min(a, b){return a > b ? b : a;}

function update(){
	function do_display(plugin, item, t){
		pk = item.pk;
		id = "result-pk-"+plugin+"-"+pk;
			if($("#"+id).length > 0){return 0;}
			item.plugin = plugin;
		item.id = id;
		time = item.fields.date;
		if(!time){time = item.fields.created_time;}
		item.time = time
		$(t).prepend(renderer.render(item));
		$("#"+id).slideDown("slow");
		$("#"+id+" .time").timeago();
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
			count = parseInt($(t).attr("count"));
            		$(t).attr("count", min(count+changes, 30));
		}
	}
	function call_updates(){
		
		q = $(this).attr("q");
		if(!q){return;}
		for(i = 0; i < plugins.length; ++i){
			url = "/feeds/"+plugins[i]+"/"+q+".json";
			$.getJSON(url, process_results(plugins[i], this));
		}
	    count = max(parseInt($(this).attr("count"))-1,0);
		$(this).attr("count", count);
        height = 6*min(count, 20)+10;
		left = $(this).hasClass("left")
        selector = left?"#fluid-left":"#fluid-right";
        //height of the tube is 138
		$(selector).animate({height:height+"px", 
                            marginTop:(140-height)+"px"}, 1000);
    }
    $(".resultlist").each(call_updates);
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
    	$(".resultlist").each(function(){$(this).children().remove();});
}

//Adds handler for search button, and starts the updater running ever 2.5s
$(document).ready(function(){
	$("#form button").click(form_button);
    	$(".resultlist").attr("count", 0);
	setInterval(update, 2500);
});
