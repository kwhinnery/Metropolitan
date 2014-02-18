/**
 * Module dependencies.
 */
var express = require('express')
  , routes = require('./routes')
  , cache = require('./routes/cache')
  , http = require('http')
  , path = require('path'),
    twilio = require('twilio'),
    config = require('./config');;
var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' === app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get("/cache/:key", cache.getCache);
app.put("/cache", cache.putCache);
app.delete("/cache/:key", cache.removeCache);

// Include routes which handle the generation of capability tokens
require('./capability')(app);

// Create a route which handles sending an outbound text message
app.post('/sms', function(request, response) {
    // The actual body of the message and the number to send to are POST params
    var smsBody = request.param('body'),
        smsTo = request.param('to');

    // create an authenticated Twilio REST API client
    var client = twilio(config.sid, config.tkn);

    // Send the requested text message
    client.sendMessage({
        from:twilioNumber,
        to:smsTo,
        body:smsBody
    }, function(err, data) {
        // Send error info as JSON, if any
        response.send(err);
    });
});

// Define TwiML to be used in the outbound call
app.post('/outbound', function(request, response) {
    // Get number to call from request
    var number = request.param('to');

    // Create TwiML instructions for the outbound dial
    var twiml = new twilio.TwimlResponse();
    twiml.dial(number, {
        callerId:twilioNumber,
    });

    // Send TwiML response as XML
    response.type('text/xml');
    response.send(twiml.toString());
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
