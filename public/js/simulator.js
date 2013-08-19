
$('#colors a[data-value="2"]').addClass("active");
var socket;
var blinkTimeout;
var readingTimeout;
var bStreaming = false;
var journeyDuration = 0;
var bRecording = false;
var readings = [];
var recordElapsedTime = 0;

$(init)

function init() {
	$("#colors a").click(function(){
		$("#colors a").removeClass("active");
		$(this).addClass("active");
	});

	try{  
		socket = new WebSocket("ws://localhost:8081");  
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
				if(json.status=="OK") {
					recordElapsedTime = 0;
					readings = [];
				}
				alert("Save Status: "+json.status);
			}
		}  

		socket.onclose = function(){  
			$("#ws_status").html('Socket Status: '+socket.readyState+' (Closed)');  
		}           

	} catch(exception){  
		$("#ws_status").html('Error'+exception);  
	}  

	$("#btn-stream-on").click(startStream);
	$("#btn-stream-off").click(stopStream);
	$("#btn-submit").click(submit);
	$("#btn-reset").click(reset);
	$("#btn-record").click(toggleRecord);

	blinkTimeout = setTimeout(doBlink, 1000);
	readingTimeout = setTimeout(doReading, 1000);
	updateTimeout = setInterval(update, 100);
}

function pad(n, width, z) {
	z = z || '0';
	n = n + '';
	return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function update() {

	if(bRecording) {
		recordElapsedTime += 100;
	}

   var hours = Math.floor(recordElapsedTime / 36e5),
        mins = Math.floor((recordElapsedTime % 36e5) / 6e4),
        secs = Math.floor((recordElapsedTime % 6e4) / 1000);
        $('#recordTime').html(pad(hours, 2)+':'+pad(mins, 2)+':'+pad(secs, 2));  
	$("#numReadings").html(readings.length);
}

function toggleRecord() {
	if(bRecording) {
		$("#btn-record").text("Record");
		bRecording = false;
	} else {
		$("#btn-record").text("Stop");
		bRecording = true;
	}
}

function submit() {
	bRecording = false;
	$("#btn-record").text("Record");

	var client_id = $('#colors a.active').attr("data-value");
	var timestamp = Math.round(new Date().getTime() / 1000);
	var message = {"client_id": client_id, "route": "submit", "timestamp": timestamp, "readings": readings};
	console.log(JSON.stringify(message));
	socket.send(JSON.stringify(message));
}

function reset() {
	readings = [];
	recordElapsedTime = 0;

	$("#btn-record").text("Record");
	bRecording = false;
	
	/*
	var client_id = $('#colors a.active').attr("data-value");
	var timestamp = Math.round(new Date().getTime() / 1000);
	var message = {"client_id": client_id, "route": "reset", "timestamp": timestamp};
	console.log(JSON.stringify(message));
	socket.send(JSON.stringify(message));
	*/
}

function identify() {
	var client_id = $('#colors a.active').attr("data-value");
	var timestamp = Math.round(new Date().getTime() / 1000);
	var message = {"client_id": client_id, "route": "identify", "timestamp": timestamp};
	console.log(JSON.stringify(message));
	socket.send(JSON.stringify(message));
}

function startStream() {
	$("#stream a").removeClass("active");
	$("#btn-stream-on").addClass("active");
	bStreaming = true;
	identify();
}

function stopStream() {
	$("#stream a").removeClass("active");
	$("#btn-stream-off").addClass("active");
	bStreaming = false;
	identify();
}

function doReading() {
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

	if(bStreaming) {
		var timestamp = Math.round(new Date().getTime() / 1000);
		var client_id = $('#colors a.active').attr("data-value");
		var message = {"client_id": client_id, "route": "reading", "reading": data, "timestamp":timestamp};
		socket.send(JSON.stringify(message));
	}
	if(bRecording) {
		var timestamp = Math.round(new Date().getTime() / 1000);
		readings.push( {"reading": data, "timestamp":timestamp} );
	}

	var wait = 500 + (Math.random() * 400);
	readingTimeout = setTimeout(doReading, wait);
}

function doBlink() {
	var data = {"blinkStrength" : 50 + Math.ceil(Math.random()*50) };
	$("#tg_data").html(JSON.stringify(data, undefined, 2));

	if(bStreaming) {
		var timestamp = Math.round(new Date().getTime() / 1000);
		var client_id = $('#colors a.active').attr("data-value");
		var message = {"client_id": client_id, "route": "reading", "reading": data, "timestamp":timestamp};
		socket.send(JSON.stringify(message));
	}

	if(bRecording) {
		var timestamp = Math.round(new Date().getTime() / 1000);
		readings.push( {"reading": data, "timestamp":timestamp} );
	}

	var wait = 800 + (Math.random() * 200);
	blinkTimeout = setTimeout(doBlink, wait);
}

