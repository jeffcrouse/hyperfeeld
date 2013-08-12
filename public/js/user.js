var start, stop;
var data = [];
$('#colors a[data-value="Red"]').addClass("active");
var bSimulateDevice = false;
var bRecording = false;

$(function(){

	$('#myModal').modal()

	$("#colors a").click(function(){
		$("#colors a").removeClass("active");
		$(this).addClass("active");
	});

	$("#start-btn").click(startRecording);
	$("#stop-btn").click(stopRecording);
	$("#send-btn").click(submitJourney);
	$("#simulator-on-btn").click(simulatorOn);
	$("#simulator-off-btn").click(simulatorOff)
	setInterval(update, 100);
})

function update() {
	if(bSimulateDevice) {
		onData({"attention": Math.random(), "meditation": Math.random(), "date": new Date()});
	}
	$("#info").text("Data: "+data.length)
}

function reset() {
	data = [];
}

function startRecording() {
	$("#control a").removeClass("active");
	$(this).addClass("active");
	start = new Date();
	bRecording = true;
}

function stopRecording() {
	$("#control a").removeClass("active");
	$("#stop-btn").addClass("active");
	stop = new Date();
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
			alert("There was an error submitting your data: "+data.error);
		} else {
			reset();
		}
	}, 'json')
	.done(function() { alert("second success"); })
	.fail(function() { alert("error"); })
	.always(function() { alert("finished"); });

	// send data to server here
}

function accessoryStatus(status) {
	if(status=="NO_ACCESSORY") {

	} else if("OK") {

	}
}



function simulatorOn() {
	$("#simulator a").removeClass("active");
	$(this).addClass("active");
	bSimulateDevice = true;
}

function simulatorOff() {
	$("#simulator a").removeClass("active");
	$(this).addClass("active");
	bSimulateDevice = false;
}

/**
*	This function is called from the iOS app -OR- in animate() if bSimulateDevice is true
*/
function onData( d ) {
	if(bRecording) {
		data.push(d);
	}

	var attention = Math.ceil(d.attention*100)+"%";
	var meditation = Math.ceil(d.meditation*100)+"%";
	$("#attention .progress-bar").css("width", attention);
	$("#meditation .progress-bar").css("width", meditation);
}