var plugins = ["facebook", "twitter"];
var renderer = new EJS({url:"/static/js/result.ejs"});

function max(a, b){
    return a > b ? a : b;
}

function update(){
	function do_display(plugin, item, t){
		pk = item.pk;
        id = "result-pk-"+plugin+"-"+pk;
		if($("#"+id).length > 0){return 0;}
		item.plugin = plugin;
        item.id = id;
		$(t).prepend(renderer.render(item));
        $("#"+id).slideDown("slow");
		$(t).children().removeClass("gap").slice(9,10).addClass("gap");
        $(t).children().slice(50).remove();
        return 1;
	}
	function process_results(plugin, t){
		return function(data, textStatus, xhr){
            changes = 0;
			for(i=data.length-1; i >=0; --i){
				changes += do_display(plugin, data[i], t);
			}
            $(t).attr("count",max(parseInt($(t).attr("count")) + changes, 30));
		}
	}
	function call_updates(){
        count = max(parseInt($(this).attr("count"))-2,0);
        $(this).attr("count", count);
        shift = 130 - 6*count;
        if($(this).parent(".left").length > 1){
            $("#vessel-left").animate({backgroundPosition: "0 -"+shift+"px"}, 
                                                    1000, "linear");
        }else{
            $("#vessel-right").animate({backgroundPosition: "0 -"+shift+"px"}, 
                                                    1000, "linear");
        }
		q = $(this).attr("q");
		if(!q){return;}
		for(i = 0; i < plugins.length; ++i){
			url = "/feeds/"+plugins[i]+"/"+q+".json";
			$.getJSON(url, process_results(plugins[i], this));
		}
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
	setInterval(update, 2500)
});
