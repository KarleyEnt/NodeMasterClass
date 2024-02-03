/*
 * These are server related tasks
 *
 */

var http = require('http');
var https = require('https');
const { StringDecoder } = require('string_decoder');
var url = require('url');
const config = require('./config');
const fs = require('fs');
const handlers = require('./handlers');
// let _data = require('./data');
let helpers = require('./helpers');
let path = require('path');

// Instantiate the server module object
let server = {};

server.init = function () { };

// @TODO Get rid of this
// helpers.sendTwilioSms('4158375309', 'Hello!', function(err){
//   console.log('this was the err:', err)
// });

// TESTING
// @TODO delete this
// _data.create('test', 'newFile', {'foo': 'bar'}, function(err) {
//  console.log('this was the error:', err);
// });
// _data.read('test', 'newFile1', function(err, data) {
//   if(!err) {
//     console.log('this is the data', data);
//   } else {
//     console.log('this is the error', err);
//   }
// });
// _data.update('test', 'newFile1', {'fizz': 'buzz'}, function(err) {
//   if(!err) {
//     console.log('Data updated');
//   } else {
//     console.log('This is the error', err);
//   }
// });
// _data.delete('test', 'newFile', function(err){
//   console.log('This is the error:', err);
// });

// Instantiate the HTTP server
server.httpServer = http.createServer((req, res) => {
  server.unifiedServer(req, res);
});

// Instantiate the HTTPS server
server.httpsServerOptions = {
  'key': fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
  'cert': fs.readFileSync(path.join(__dirname, '/../https/cert.pem'))
};
server.httpsServer = https.createServer(server.httpsServerOptions, (req, res) => {
  server.unifiedServer(req, res);
});

// All the server logic for both the http and https server
server.unifiedServer = function (req, res) {
  // get the url and parse it
  var parsedUrl = url.parse(req.url, true);

  // get the path
  var path = parsedUrl.pathname;
  var trimmedPath = path.replace(/^\/+|\/+$/g, '');

  // get the querystring as an object
  var queryStringObject = parsedUrl.query;

  // get the HTTP method
  var method = req.method.toLowerCase();

  // get the headers an object
  var headers = req.headers;

  // get the payload, if any
  var decoder = new StringDecoder('utf-8');
  var buffer = '';
  req.on('data', function (data) {
    buffer += decoder.write(data);
  });
  req.on('end', function () {
    buffer += decoder.end();

    //choose the handler this request should go to
    let chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

    // If the request is within the public directory, use the public handler instead
    chosenHandler = trimmedPath.indexOf('public/') > -1 ? handlers.public : chosenHandler;

    // Construct the data object to send to the handler
    var data = {
      trimmedPath,
      queryStringObject,
      method,
      headers,
      'payload': helpers.parseJsonToObject(buffer)
    };

    // route the request to the handler specified in the router
    chosenHandler(data, (statusCode, payload, contentType) => {
      // Determine the type of response (fallback to JSON)
      contentType = typeof(contentType) === 'string' ? contentType : 'json';

      // Use the status code called by the the handler of default to 200
      statusCode = typeof(statusCode) === 'number' ? statusCode : 200;

      // Return the response-parts that are content specific
      let payloadString = '';
      if (contentType === 'json') {
        res.setHeader('Content-Type', 'application/json');
        // Use the payload called back by the handler, or default to an empty object
        payload = typeof(payload) === 'object' ? payload : {};
        // convert the payload to a string
        payloadString = JSON.stringify(payload);
      } else if (contentType === 'html') {
        res.setHeader('Content-Type', 'text/html');
        payloadString = typeof(payload) === 'string' ? payload : '';
      } else if (contentType === 'favicon') {
        res.setHeader('Content-Type', 'image/x-icon');
        payloadString = typeof(payload) !== undefined ? payload : '';
      } else if (contentType === 'css') {
        res.setHeader('Content-Type', 'text/css');
        payloadString = typeof(payload) !== undefined ? payload : '';
      } else if (contentType === 'png') {
        res.setHeader('Content-Type', 'image/png');
        payloadString = typeof(payload) !== undefined ? payload : '';
      } else if (contentType === 'jpeg') {
        res.setHeader('Content-Type', 'image/jpeg');
        payloadString = typeof(payload) !== undefined ? payload : '';
      } else if (contentType === 'plain') {
        res.setHeader('Content-Type', 'text/plain');
        payloadString = typeof(payload) !== undefined ? payload : '';
      }

      // return the response-parts that are common to all content-types
      res.writeHead(statusCode);
      res.end(payloadString);

    });
  });
};

// Define request routers
server.router = {
  '': handlers.index,
  'account/create': handlers.accountCreate,
  'account/edit': handlers.accountEdit,
  'account/deleted': handlers.accountDeleted,
  'session/create': handlers.sessionCreate,
  'session/deleted': handlers.sessionDeleted,
  'checks/all': handlers.checksList,
  'checks/create': handlers.checksCreate,
  'checks/edit': handlers.checksEdit,
  sample: handlers.sample,
  ping: handlers.ping,
  'api/users': handlers.users,
  'api/tokens': handlers.tokens,
  'api/checks': handlers.checks,
  'favicon.ico': handlers.favicon,
  'public': handlers.public
};

// Init script
server.init = function () {
  // Start the http server
  server.httpServer.listen(config.httpPort, () => {
    console.log('Server is listening on ' + config.httpPort);
  });
  // start the https server
  server.httpsServer.listen(config.httpsPort, () => {
    console.log('Server is listening on ' + config.httpsPort);
  });
}


module.exports = server;