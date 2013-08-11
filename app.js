
/**
 * Module dependencies.
 */

var express = require('express')
	//, routes = require('./routes')
	//, user = require('./routes/user')
	, http = require('http')
	, path = require('path');

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

app.get('/user', function(req, res){
	var data = {"title": "brainz.io"};
	data.colors = [
		  {"name": "Red", "hex": "FF6363"}
		, {"name": "Orange", "hex": "FFB62E"}
		, {"name": "Yellow", "hex": "DEDE40"}
		, {"name": "Green", "hex": "4FE63C"}
		, {"name": "Blue", "hex": "00B7C4"}
		, {"name": "Indigo", "hex": "8366D4"}
		, {"name": "Violet", "hex": "E33BCF"}
	];
	res.render("user", data);
});



http.createServer(app).listen(app.get('port'), function(){
	console.log("Express server listening on port " + app.get('port'));
});





/**
*	Websocket!
*/
var WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({port: 8080});
wss.on('connection', function(ws) {

	var tick = setInterval(function(){
		var msg = {"route": "tick", "message": {"date": new Date()}};
		ws.send(JSON.stringify(msg), function(error){ if(error) console.log(error) });
	}, 1000);

	ws.on('message', function(message) {
		console.log('received: %s', message);
	});

	ws.on('close', function() {
		clearInterval(tick);
		console.log("client closed.")
	});
});
