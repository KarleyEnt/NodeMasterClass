/*
 * Frontend logic for the app
 *
 */



// Container for the frontend application
let app = {};

// Config object
app.config = {
  'sessionToken': false
};


// AJAX Client (for the restful API)
app.client = {};

// Interface for making API calls
app.client.request = function(headers, path, method, queryStringObject, payload, callback){
  headers = typeof(headers) === 'object' && headers !== null ? headers : {};
  path = typeof(path) === 'string' && path.length > 0 ? path : '/';
  method = typeof(method) === 'string' && ['POST', 'GET', 'PUT', 'DELETE'].indexOf(method.toUpperCase()) > -1 ? method.toUpperCase() : 'GET';
  queryStringObject = typeof(queryStringObject) === 'object' && queryStringObject !== null ? queryStringObject : {};
  payload = typeof(payload) === 'object' && payload !== null ? payload : {};
  callback = typeof(callback) === 'function' ? callback : false;

  // For each query string parameter string sent, add it to the path
  let requestUrl = path+'?';
  let counter = 0;
  for (queryKey in queryStringObject) {
    if(queryStringObject.hasOwnProperty(queryKey)){
      counter++;
      // If atleast one query string param has ben added, prepend new queries with &
      if(counter > 1) {
        requestUrl += '&';
      }
      // Add the key and value
      requestUrl += queryKey+'='+queryStringObject[queryKey];
    }
  }

  // Form the http request as a JSON type
  let xhr = new XMLHttpRequest();
  xhr.open(method, requestUrl, true);
  xhr.setRequestHeader("Content-Type", "application/json");

  // For each header sent, add it to the request
  for(let headerKey in headers) {
    if(headers.hasOwnProperty(headerKey)) {
      xhr.setRequestHeader(headerKey, headers[headerKey]);
    }
  }

  // If there is a current session token, add that as a header
  if(app.config.sessionToken) {
    xhr.setRequestHeader('token', app.config.sessionToken.tokenId);
  }

  // When the request comes back handle the response
  xhr.onreadystatechange = function(){
    if(xhr.readyState === XMLHttpRequest.DONE) {
      let statusCode = xhr.status;
      let responseReturned = xhr.responseText;

      // Callback if requested
      if(callback) {
        try {
          let parsedResponse = JSON.parse(responseReturned);
          callback(statusCode, parsedResponse);
        } catch(e) {
          callback(statusCode, false);
        }
      }
    }
  };

  // Send the payload as JSON (sending the request)
  let payloadString = JSON.stringify(payload);
  xhr.send(payloadString);
  
};