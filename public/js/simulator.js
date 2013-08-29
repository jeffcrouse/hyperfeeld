
$('#client_id a[data-value="Sim2"]').addClass("active");

var blinkTimeout;
var readingTimeout;
var journeyDuration = 0;
var bRecording = false;
var readings = [];
var events = [];
var recordElapsedTime = 0;
var attention = 0,
	attention_y = Math.random();
var meditation = 0,
	meditation_y = Math.random();
var sn = new SimplexNoise();
$(init)

function init() {
	$("#client_id a").click(function(){
		$("#client_id a").removeClass("active");
		$(this).addClass("active");
	});

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

	var x = new Date().getTime() / 10000;
	attention = 50+Math.floor(sn.noise(x, attention_y)*50); //Math.ceil(Math.random() * 100);
	meditation = 50+Math.floor(sn.noise(x, meditation_y)*50); //Math.ceil(Math.random() * 100);

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

	var email = prompt("Please enter your email (optional)","someone@somewhere.com");
	var client_id = $('#client_id a.active').attr("data-value");
	var journey = {
		"date": new Date(), 
		"client_id": client_id, 
		"email": email,
		"readings": readings, 
		"events": events
	};
	console.log(journey);
	
	$.ajax({
		type: "POST",
		url: "/submit/journey",
		data: JSON.stringify(journey),
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		success: function(data){
			if(data.status=="OK") {
				readings = [];
				recordElapsedTime = 0;
				alert("Journey saved!")
			} else {
				alert("Error: "+data.status);
			}
		},
		failure: function(errMsg) {
			alert(errMsg);
		}
	});
}

function reset() {
	readings = [];
	events = [];
	recordElapsedTime = 0;
	$("#btn-record").text("Record");
	bRecording = false;
}

function doReading() {
	var reading = {
		"date": new Date(),
		"data": { "attention" : attention, "meditation" : meditation }
	}
	$("#readings").html(JSON.stringify(reading, undefined, 2));

	if(bRecording) 
		readings.push( reading );

	var wait = 1000 + (Math.random() * 300);
	readingTimeout = setTimeout(doReading, wait);
}

function doBlink() {
	var data = {
		'date': new Date(), 
		"eventType": "blink", 
		"data": {
				"strength": 50 + Math.ceil(Math.random()*50)
		} 
	};
	$("#events").html(JSON.stringify(data, undefined, 2));

	if(bRecording)
		events.push( data);

	var wait = 800 + (Math.random() * 200);
	blinkTimeout = setTimeout(doBlink, wait);
}

