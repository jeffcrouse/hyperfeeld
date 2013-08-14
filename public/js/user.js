var data = [];
$('#colors a[data-value="Red"]').addClass("active");
var bRecording = false;
var simulatorInterval = null;


$(function(){

	$('#myModal').modal()

	$("#colors a").click(function(){
		$("#colors a").removeClass("active");
		$(this).addClass("active");
	});

	$("#btn-start").click(startRecording);
	$("#btn-stop").click(stopRecording);
	$("#btn-send").click(submitJourney);
	$("#btn-enable-simulator").click(enableSimulator);
	$("#btn-reload").click(function(){location.reload()});
})

function enableSimulator() {
	simulatorInterval = setInterval(function(){

		var d = {
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
function onData( d ) {
	if(bRecording) {
		data.push(d);
	}

	var attention = Math.ceil(d.attention*100)+"%";
	var meditation = Math.ceil(d.meditation*100)+"%";
	$("#attention .progress-bar").css("width", attention);
	$("#meditation .progress-bar").css("width", meditation);
	$("#info").text("Data: "+data.length);
}