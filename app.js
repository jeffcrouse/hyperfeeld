
/**
 * Module dependencies.
 */

var express = require('express')
	//, routes = require('./routes')
	//, user = require('./routes/user')
	, http = require('http')
	, path = require('path')
	, mongoose = require('mongoose')
	, WebSocketServer = require('ws').Server
	, os = require("os")


/**
*	Configure database
*/
mongoose.connect('mongodb://hyperfeel:pinguinshavefeelings@ds035237.mongolab.com:35237/hyperfeel');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
	console.log("connected to database.")
});

var journeySchema = mongoose.Schema({
      created_at: { type: Date, default: Date.now }
    , client_id: String
    , readings: [mongoose.Schema.Types.Mixed] 
});
var Journey = mongoose.model('Journey', journeySchema);



/**
*	Configure app
*/
var app = express();

app.configure(function(){
	app.set('port', process.env.PORT || 3000);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'ejs');
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.cookieParser('your secret here'));
	app.use(express.session());
	app.use(app.router);
	app.use(require('less-middleware')({ src: __dirname + '/public' }));
	app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
	app.use(express.errorHandler());
});

app.get('/', function(req, res){
	res.render("index", {"title": "brainz.io"});
});

app.get('/simulator', function(req, res){
	var data = {"title": "Simulator"};
	data.colors = [
		  {"name": "Red", "hex": "FF6363"}
		, {"name": "Orange", "hex": "FFB62E"}
		, {"name": "Yellow", "hex": "DEDE40"}
		, {"name": "Green", "hex": "4FE63C"}
		, {"name": "Blue", "hex": "00B7C4"}
		, {"name": "Indigo", "hex": "8366D4"}
		, {"name": "Violet", "hex": "E33BCF"}
	];
	res.render("simulator", data);
});


app.post('/submit/journey', function(req, res) {
	var journey = new Journey(req.body);
	journey.save(function(err, doc){
		if(err) {
			res.send({"error": err});
			console.log(err)
		} else {
			viz_server.broadcast(JSON.stringify(doc));
			res.send({"status": "OK"});
		}
	});
});


http.createServer(app).listen(app.get('port'), function(){
	console.log("Express server listening on port " + app.get('port'));
});





/**
*	viz_server Websocket!
*/
var viz_clients = [];
var viz_server = new WebSocketServer({port: 8080});
console.log("visualization server running at ws://%s:8080", os.hostname());
viz_server.on('connection', function(client) {
	viz_clients.push( client );

	// Send all of the existing 
	Journey.find().sort('-created_at').exec(function(err, docs){
		client.send(JSON.stringify(docs));
	});

	var tick = setInterval(function(){
		var msg = {"route": "tick", "message": {"date": new Date()}};
		client.send(JSON.stringify(msg), function(error){ if(error) console.log(error) });
	}, 1000);

	client.on('message', function(message) {
		console.log('received: %s', message);
	});

	client.on('close', function() {
		clearInterval(tick);
		for(var i=0; i<viz_clients.length; i++) {
			if(viz_clients[i]==client) viz_clients.splice(i, 1);
		}
		console.log("client closed.")
	});
});
viz_server.broadcast = function(message) {
	for(var i=0; i<viz_clients.length; i++) {
		viz_clients[i].send(journey, function(err){})
	}
}




/**
*	tg_server Websocket!
*/
var tg_clients = [];
var tg_server = new WebSocketServer({port: 8081});
console.log("ThinkGear server running at ws://%s:8081", os.hostname());
tg_server.on('connection', function(client) {
	tg_clients.push( client );

	var readings = [];

	client.on('message', function(message) {
		var message = JSON.parse(message);

		if(message.route == "reading") {
			console.log( "message.client_id = " + message.client_id );

			var date = new Date(message.timestamp*1000);
			readings.push( {"data": message.reading, "date": date });
			client.send(JSON.stringify({"route": "info", "numReadings": readings.length}));
		}

		if(message.route == "submit") {
			if(readings.length < 20) {
				client.send(JSON.stringify({"route": "saveStatus", "status": "not enough readings"}));
			} else {
				var journey = new Journey({readings: readings, client_id: message.client_id });
				journey.save(function(err, doc){
					if(err) {
						client.send(JSON.stringify({"route": "saveStatus", "status": err}));
						console.log(err)
					} else {
						viz_server.broadcast(JSON.stringify(doc));
						client.send(JSON.stringify({"route": "saveStatus", "status": "OK"}));
					}
				});
				
				readings = []
				client.send(JSON.stringify({"route": "info", "numReadings": readings.length}));
			}
		}

		if(message.route == "reset") {
			readings = []
			client.send(JSON.stringify({"route": "info", "numReadings": readings.length}));
		}
	});

	client.on('close', function() {
		var index = tg_clients.indexOf(client);
		if(index != -1) {
			console.log("removing client from list");
			tg_clients.splice(index, 1);
		}
		console.log("client closed.")
	});
});





