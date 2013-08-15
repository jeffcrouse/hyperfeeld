
$('#colors a[data-value="2"]').addClass("active");
var host = "ws://localhost:8081"; 
var socket;
var blinkTimeout;
var readingTimeout;

$(function(){
	$("#colors a").click(function(){
		$("#colors a").removeClass("active");
		$(this).addClass("active");
	});


	try{  
		socket = new WebSocket(host);  

		socket.onopen = function(){  
			console.log('Socket Status: '+socket.readyState+' (open)');  
		}  

		socket.onmessage = function(msg){  
			console.log('Received: '+msg.data);  
		}  

		socket.onclose = function(){  
			console.log('Socket Status: '+socket.readyState+' (Closed)');  
		}           

	} catch(exception){  
		console.log('Error'+exception);  
	}  

	$("#btn-simulator-on").click(startSimulator);
	$("#btn-simulator-off").click(stopSimulator);
	$("#btn-submit").click(submit);
	$("#btn-reset").click(reset);
})

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
	$("#simulator-on-btn").addClass("active");

	blinkTimeout = setTimeout(sendBlink, 1000);
	readingTimeout = setTimeout(sendReading, 1000);
}

function stopSimulator() {
	$("#simulator a").removeClass("active");
	$("#simulator-off-btn").addClass("active");

	clearTimeout(blinkTimeout);
	clearTimeout(readingTimeout);
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
	var timestamp = Math.round(new Date().getTime() / 1000);
	var client_id = $('#colors a.active').attr("data-value");
	var message = {"client_id": client_id, "route": "reading", "reading": data, "timestamp":timestamp};
	console.log(JSON.stringify(message));
	socket.send(JSON.stringify(message));

	var wait = 500 + (Math.random() * 400);
	readingTimeout = setTimeout(sendReading, wait);
}

function sendBlink() {
	var data = {"blinkStrength" : Math.ceil(Math.random()*100) };
	var timestamp = Math.round(new Date().getTime() / 1000);
	var client_id = $('#colors a.active').attr("data-value");
	var message = {"client_id": client_id, "route": "reading", "reading": data, "timestamp":timestamp};
	console.log(JSON.stringify(message));
	socket.send(JSON.stringify(message));

	var wait = 800 + (Math.random() * 200);
	blinkTimeout = setTimeout(sendBlink, wait);
}

/*
function enableSimulator() {
	simulatorInterval = setInterval(function(){





		onData({"attention": Math.random(), "meditation": Math.random(), "date": new Date()});
	}, 100);
}

function reset() {
	data = [];
}

function startRecording() {
	$("#control a").removeClass("active");
	$(this).addClass("active");
	bRecording = true;
}

function stopRecording() {
	$("#control a").removeClass("active");
	$("#stop-btn").addClass("active");
	bRecording = false;
}

function submitJourney() {
	stopRecording()
	var color = $('#colors a.active').attr("data-value");
	var journey = {
		  created_at: new Date()
		, nsid: color
		, data: data
	};

	$.post("/submit/journey", journey, function(data) {
		if(data.error) {
			console.log("There was an error submitting your data: "+data.error);
		} else {
			reset();
		}
	}, 'json')
	.done(function() { alert("second success"); })
	.fail(function() { alert("error"); })
	.always(function() { alert("finished"); });
}


function accessoryStatus(status) {
	if(status=="NO_ACCESSORY") {
		$('#myModal').modal()
	} else if("OK") {
		if(simulatorInterval) clearInterval(simulatorInterval);
	}
}
*/
/**
*	This function is called from the iOS app -OR- in animate() if bSimulateDevice is true
	{
	  "poorSignal" : 0,
	  "eegLowGamma" : 14936,
	  "eegDelta" : 644709,
	  "eSenseAttention" : 56,
	  "eegHighBeta" : 22077,
	  "eegTheta" : 266277,
	  "eegLowBeta" : 40534,
	  "eSenseMeditation" : 54,
	  "eegHighGamma" : 26642,
	  "eegLowAlpha" : 90809,
	  "eegHighAlpha" : 18006,
	  "rawCount" : 512
	}

	{
		"blinkStrength" : 82
	}
*/
