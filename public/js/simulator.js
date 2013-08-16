
$('#colors a[data-value="2"]').addClass("active");
var socket;
var blinkTimeout;
var readingTimeout;
var bSendingData = false;
var journeyDuration = 0;

$(init)

function init() {
	$("#colors a").click(function(){
		$("#colors a").removeClass("active");
		$(this).addClass("active");
	});

	try{  
		socket = new WebSocket(ws_host);  

		socket.onopen = function(){  
			$("#ws_status").html('Socket Status: '+socket.readyState+' (open)');  
		}  

		socket.onmessage = function(msg){  
			//console.log(msg);
			var json = JSON.parse(msg.data);
			if(json.route=="info") {
				$("#info").html("Readings received: "+json.numReadings);
			}
			if(json.route=="saveStatus"){
				alert("Save Status: "+json.status);
			}
		}  

		socket.onclose = function(){  
			$("#ws_status").html('Socket Status: '+socket.readyState+' (Closed)');  
		}           

	} catch(exception){  
		$("#ws_status").html('Error'+exception);  
	}  

	$("#btn-simulator-on").click(startSimulator);
	$("#btn-simulator-off").click(stopSimulator);
	$("#btn-submit").click(submit);
	$("#btn-reset").click(reset);

	blinkTimeout = setTimeout(sendBlink, 1000);
	readingTimeout = setTimeout(sendReading, 1000);
}

function submit() {
	stopSimulator();

	var client_id = $('#colors a.active').attr("data-value");
	var timestamp = Math.round(new Date().getTime() / 1000);
	var message = {"client_id": client_id, "route": "submit", "timestamp": timestamp};
	console.log(JSON.stringify(message));
	socket.send(JSON.stringify(message));
}

function reset() {
	stopSimulator();

	var client_id = $('#colors a.active').attr("data-value");
	var timestamp = Math.round(new Date().getTime() / 1000);
	var message = {"client_id": client_id, "route": "reset", "timestamp": timestamp};
	console.log(JSON.stringify(message));
	socket.send(JSON.stringify(message));
}

function startSimulator() {
	$("#simulator a").removeClass("active");
	$("#btn-simulator-on").addClass("active");
	bSendingData = true;

}

function stopSimulator() {
	$("#simulator a").removeClass("active");
	$("#btn-simulator-off").addClass("active");
	bSendingData = false;
	//clearTimeout(blinkTimeout);
	//clearTimeout(readingTimeout);
}

function sendReading() {
	var data = {
		"poorSignal" : 0,
		"eegLowGamma" : Math.ceil(Math.random() * 999999),
		"eegDelta" : Math.ceil(Math.random() * 999999),
		"eSenseAttention" : Math.ceil(Math.random() * 100),
		"eegHighBeta" : Math.ceil(Math.random() * 999999),
		"eegTheta" : Math.ceil(Math.random() * 999999),
		"eegLowBeta" : Math.ceil(Math.random() * 999999),
		"eSenseMeditation" : Math.ceil(Math.random() * 100),
		"eegHighGamma" : Math.ceil(Math.random() * 999999),
		"eegLowAlpha" : Math.ceil(Math.random() * 999999),
		"eegHighAlpha" : Math.ceil(Math.random() * 999999),
		"rawCount" : 512
	}
	$("#tg_data").html(JSON.stringify(data, undefined, 2));

	if(bSendingData) {
		var timestamp = Math.round(new Date().getTime() / 1000);
		var client_id = $('#colors a.active').attr("data-value");
		var message = {"client_id": client_id, "route": "reading", "reading": data, "timestamp":timestamp};
		socket.send(JSON.stringify(message));
	}

	var wait = 500 + (Math.random() * 400);
	readingTimeout = setTimeout(sendReading, wait);
}

function sendBlink() {
	var data = {"blinkStrength" : 50 + Math.ceil(Math.random()*50) };
	$("#tg_data").html(JSON.stringify(data, undefined, 2));

	if(bSendingData) {
		var timestamp = Math.round(new Date().getTime() / 1000);
		var client_id = $('#colors a.active').attr("data-value");
		var message = {"client_id": client_id, "route": "reading", "reading": data, "timestamp":timestamp};
		socket.send(JSON.stringify(message));
	}

	var wait = 800 + (Math.random() * 200);
	blinkTimeout = setTimeout(sendBlink, wait);
}

