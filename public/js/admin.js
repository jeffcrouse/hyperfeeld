var colors = [
	  {"name": "Red", "hex": "FF6363"}
	, {"name": "Orange", "hex": "FFB62E"}
	, {"name": "Yellow", "hex": "DEDE40"}
	, {"name": "Green", "hex": "4FE63C"}
	, {"name": "Blue", "hex": "00B7C4"}
	, {"name": "Indigo", "hex": "8366D4"}
	, {"name": "Violet", "hex": "E33BCF"}
]
var socket;
$(document).ready(function() {

	$("#btn-delete").click(function(){
		console.log("btn-delete");
		$(':checkbox').each(function () {
			if(this.checked)  {
				var _id = $(this).val();
				console.log(JSON.stringify({"route": "removeJourney", "_id": _id}));
				socket.send(JSON.stringify({"route": "removeJourney", "_id": _id}));
			}
		});
	});


	var oTable = $('#journeys').dataTable( {
		"sScrollY": "600px",
		"bPaginate": false,
	});

    socket = new WebSocket("ws://localhost:8080");

	/**
	*
	*/
	socket.onopen = function(){  
		console.log('Socket Status: '+socket.readyState+' (open)');  
	}  

	/**
	*
	*/
	socket.onmessage = function(msg){  
		//console.log(msg);
		var json = JSON.parse(msg.data);
		if(json.route=="init") {
			json.journeys.forEach(function(journey){
				addJourney(journey);
			});
		}
		else if(json.route=="tick") {

		}
		else if(json.route=="journey"){
			addJourney(json.journey);
		}
		else if(json.route=="removeJourney") {
			removeJourney(json._id)
		}
		else {
			console.log("unknown route!")
		}
	}  

	/**
	*
	*/
	socket.onclose = function() {  
		console.log.html('Socket Status: '+socket.readyState+' (Closed)');  
	}          
});

function removeJourney(_id) {
	console.log("Removing: "+_id)
    $("#journeys tr td").each(function() {

    	if($(this).text() == _id) {
    		var tr = $(this).parent('tr').get(0);
    		$('#journeys').dataTable().fnDeleteRow(tr);
    	}

    });	
}


/**
*
*/
function addJourney(journey) {
	var checkbox = '<input type="checkbox" name="journey" value="'+journey._id+'" />';
	var email = journey.email || "";
	var date = moment(journey.created_at).format('MMMM Do YYYY, h:mm:ss a');
	var color = colors[journey.client_id];
	color = '<span style="color: #'+color.hex+'">'+color.name+"</span>";
	var n_readings = journey.readings.length;
	var start = new Date(journey.readings[0].date);
	var end = new Date(journey.readings[n_readings-1].date);
	
	var duration = Math.round((end-start)/1000);;
	var data = [checkbox, journey._id, color, date, email, n_readings, duration];
	$('#journeys').dataTable().fnAddData(data);
}


