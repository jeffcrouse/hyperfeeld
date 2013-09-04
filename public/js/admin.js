var socket;
var ctx;
var journeys = {};

$(document).ready(function() {

	ctx = document.getElementById("myChart").getContext("2d");

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
		//"sScrollY": "600px",
		//"bPaginate": false,
		//"iDisplayLength": 50,
		"aaSorting": [[ 3, "desc" ]]
	});

    socket = new WebSocket(ws_url);

	/**
	*
	*/
	socket.onopen = function(){  
		$("#socketStatus").html('Socket Status: '+socket.readyState+' (open)');  
		console.log(JSON.stringify({"route": "initMe"}));
		socket.send(JSON.stringify({"route": "initMe"}));
	}  

	/**
	*
	*/
	socket.onmessage = function(msg){  
		//console.log(msg);
		var json = JSON.parse(msg.data);
		if(json.route=="showJourney") {
			journeys[json.journey._id] = json.journey;
			addJourney(json.journey);
		}
		else if(json.route=="tick") {

		}
		else if(json.route=="addJourney"){
			journeys[json.journey._id] = json.journey;
			addJourney(json.journey);
		}
		else if(json.route=="removeJourney") {
			delete journeys[json._id];
			removeJourney(json._id)
		}
		else if(json.route=="replayJourney") {}
		else {
			console.log("unknown route!")
		}
	}  

	/**
	*
	*/
	socket.onclose = function() {  
		$("#socketStatus").html('Socket Status: '+socket.readyState+' (Closed)');  
	}       
});


function graphJourney(_id) {

	var meditation = {
		fillColor : "rgba(220,220,220,0.5)",
		strokeColor : "rgba(220,220,220,1)",
		pointColor : "rgba(220,220,220,1)",
		pointStrokeColor : "#fff",
		data: []
	};
	var attention = {
		fillColor : "rgba(151,187,205,0.5)",
		strokeColor : "rgba(151,187,205,1)",
		pointColor : "rgba(151,187,205,1)",
		pointStrokeColor : "#fff",
		data : []
	};
	var data = {
		labels: [],
		datasets: [attention, meditation]
	};

	var start = journeys[_id].readings[0].date;
	journeys[_id].readings.forEach(function(reading, idx){
		if(idx%2==0) {
			var millis = moment(reading.date).diff( start, 'milliseconds' );
			var mins = Math.floor((millis % 36e5) / 6e4),
				secs = Math.floor((millis % 6e4) / 1000);
				duration = mins+':'+pad(secs, 2);  

			data.labels.push( duration );
			meditation.data.push( reading.data.meditation );
			attention.data.push( reading.data.attention );
		}
	});

	var options = {scaleOverlay: true, scaleOverride: true, scaleSteps: 10, scaleStepWidth: 10, scaleStartValue: 0};
	var myNewChart = new Chart(ctx).Line(data, options);  
}

function removeJourney(_id) {
	console.log("Removing: "+_id)
    $("#journeys tr td").each(function() {
    	if($(this).text() == _id) {
    		var tr = $(this).parent('tr').get(0);
    		$('#journeys').dataTable().fnDeleteRow(tr);
    	}
    });	
}

function pad(n, width, z) {
	z = z || '0';
	n = n + '';
	return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}


function replay(_id) {
	console.log(JSON.stringify({"route": "replayJourney", "_id": _id}));
	socket.send(JSON.stringify({"route": "replayJourney", "_id": _id}));
}

/**
*
*/
function addJourney(journey) {
	var checkbox = '<input type="checkbox" name="journey" value="'+journey._id+'" />';
	var id = '<a href="javascript:graphJourney(\''+journey._id+'\');">'+journey._id+'</a>';;
	var email = journey.email || "";
	var date = moment(journey.created_at).format();
	var n_readings = journey.readings.length;
	var start = new Date(journey.readings[0].date);
	var end = new Date(journey.readings[n_readings-1].date);
	var millis = end-start;
	var client_id = journey.client_id || "";
	var replay = '<a href="javascript:replay(\''+journey._id+'\');">replay</a>';
	var hours = Math.floor(millis / 36e5),
		mins = Math.floor((millis % 36e5) / 6e4),
		secs = Math.floor((millis % 6e4) / 1000);
		duration = pad(hours, 2)+':'+pad(mins, 2)+':'+pad(secs, 2);  

	var data = [checkbox, id, client_id, date, email, n_readings, duration, replay];
	$('#journeys').dataTable().fnAddData(data);
}


