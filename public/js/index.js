var socket = null;

function accessoryDidConnect() {

}

function accessoryDidDisconnect() {

}

function webViewDidStartLoad() {

}

function webViewDidFinishLoad() {

}

function dataReceived(data) {

}

function message(msg, style){  
    $('body').append('<p class="'+style+'">'+msg+"</p>");  
}  

function connect( host ){  
	
    try {
		socket = new WebSocket(host);  

		message('Socket Status: '+socket.readyState, "event");  

		socket.onopen = function(){  
			message('Socket Status: '+socket.readyState+' (open)', 'event');  
		}  

		socket.onmessage = function(msg){  
			message('Received: '+msg.data, 'message');  
		}  

		socket.onclose = function(){  
			message('Socket Status: '+socket.readyState+' (Closed)', 'event');  
		}             

	} catch(exception){  
		message('Error'+exception, 'error');  
	}  
} 

$(function() {
	$("h1").html("Stuff!");
	connect("ws://localhost:8080");
});


message('Connecting', 'event');