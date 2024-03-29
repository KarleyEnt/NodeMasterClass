/*
 * Worker related tasks
 *
 */

// Dependencies
let path = require('path');
let fs = require('fs');
let _data = require('./data');
let https = require('https');
let http = require('http');
let helpers = require('./helpers');
let url = require('url');

// Instantiate the worker objects
let workers = {};

// Sanity-check the check data
workers.validateCheckData = function (originalCheckData) {
  originalCheckData = typeof (originalCheckData) === 'object' && originalCheckData !== null ? originalCheckData : {};
  originalCheckData.id = typeof (originalCheckData.id) === 'string' && originalCheckData.id.trim().length === 20 ? originalCheckData.id.trim() : false;
  originalCheckData.userPhone = typeof (originalCheckData.userPhone) === 'string' && originalCheckData.userPhone.trim().length === 10 ? originalCheckData.userPhone.trim() : false;
  originalCheckData.protocol = typeof (originalCheckData.protocol) === 'string' && ['https', 'http'].indexOf(originalCheckData.protocol) > -1 ? originalCheckData.protocol : false;
  originalCheckData.url = typeof (originalCheckData.url) === 'string' && originalCheckData.url.trim().length > 0 ? originalCheckData.url.trim() : false;
  originalCheckData.method = typeof (originalCheckData.method) === 'string' && ['post', 'put', 'get', 'delete'].indexOf(originalCheckData.method) > -1 ? originalCheckData.method : false;
  originalCheckData.successCodes = typeof (originalCheckData.successCodes) === 'object' && originalCheckData.successCodes instanceof Array && originalCheckData.successCodes.length > 0 ? originalCheckData.successCodes : false;
  originalCheckData.timeoutSeconds = typeof (originalCheckData.timeoutSeconds) === 'number' && originalCheckData.timeoutSeconds % 1 === 0 && originalCheckData.timeoutSeconds >= 1 && originalCheckData.timeoutSeconds <= 5 ? originalCheckData.timeoutSeconds : false;

  // Set the keys that may not be set (if the workers have never seen these checks before)
  originalCheckData.state = typeof (originalCheckData.state) === 'string' && ['up', 'down'].indexOf(originalCheckData.state) > -1 ? originalCheckData.state : 'down';
  originalCheckData.lastChecked = typeof (originalCheckData.lastChecked) === 'number' && originalCheckData.lastChecked > 0 ? originalCheckData.lastChecked : false;

  // If all the checks pass, pass the data along to the next step in the process
  if (originalCheckData.id
    && originalCheckData.userPhone
    && originalCheckData.protocol
    && originalCheckData.url
    && originalCheckData.method
    && originalCheckData.successCodes
    && originalCheckData.timeoutSeconds) {
    workers.performCheck(originalCheckData);
  } else {
    console.log('Error: One of the checks is not properly formatted. Skipping it.')
  }
}

// Perform the check, send the original check data and the outcome of the check process to the next step in the process
workers.performCheck = function (originalCheckData) {
  // Prepare the initial check outcome
  let checkOutcome = {
    'error': false,
    'responseCode': false
  };

  // Mark that the ouctome has not been sent yet
  let outcomeSent = false;

  // Parse the hostname and the path out of the original check data
  let parsedUrl = url.parse(originalCheckData.protocol + '://' + originalCheckData.url, true);
  let hostname = parsedUrl.hostname;
  let path = parsedUrl.path; // Using path and not the "pathname" because we want the query string.

  // Construct the request
  let requestDetails = {
    protocol: originalCheckData.protocol + ':',
    hostname,
    method: originalCheckData.method.toUpperCase(),
    path,
    timeout: originalCheckData.timeoutSeconds * 1000,
  };

  // Instantiate the request object (using either the http or https module)
  let _moduleToUse = originalCheckData.protocol === 'http' ? http : https;
  let req = _moduleToUse.request(requestDetails, function (res) {
    // Grab the status of the sent request
    let status = res.statusCode;;

    // Update the checkOutcome and pass the data along
    checkOutcome.responseCode = status;

    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    };
  });

  // Bind to the error event so it doesn't get thrown
  req.on('error', function (err) {
    // Update the checkOutcome and pass the data along
    checkOutcome.error = {
      error: true,
      value: err,
    };
    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  // Bind to the timeout event
  req.on('timeout', function (err) {
    // Update the checkOutcome and pass the data along
    checkOutcome.error = {
      error: true,
      value: 'timeout',
    };
    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  // End the request(send the request)
  req.end();

};

// Process the check outcome, update the check data as needed, trigger an alert
// Special logic for accomodating a check that has never been tested before (don't alert on that one)
workers.processCheckOutcome = function (originalCheckData, checkOutcome) {
  // Decide if the check is considered up or down
  let state = !checkOutcome.error && checkOutcome.responseCode && originalCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1 ? 'up' : 'down';

  // Decide if an alert is warranted
  let alertWarranted = originalCheckData.lastChecked && originalCheckData.state !== state ? true : false;

  // Update the check data
  let newCheckData = originalCheckData;
  newCheckData.state = state;
  newCheckData.lastChecked = Date.now();

  // Save the updates
  _data.update('checks', newCheckData.id, newCheckData, function(err){
    if(!err){
      // Send the new check data to the next phase of the process if needed
      if(alertWarranted) {
        workers.alertUserToStatusChange(newCheckData);
      } else {
        console.log('Check outcome has not changed, no alert is needed');
      }
    } else {
      console.log('Error trying to save updates to one of the checks');
    }
  });

};

// Alert the user as to a change in their check status
workers.alertUserToStatusChange = function(newCheckData){
  let msg = `Alert: Your check for ${newCheckData.method.toUpperCase()}${newCheckData.protocol}://${newCheckData.url} is currentlt ${newCheckData.state}`;
  helpers.sendTwilioSms(newCheckData.userPhone,msg,function(err){
    if(!err){
      console.log('Success: User was alerted', msg);
    } else {
      console.log('Error: Could not send an sms alert for state change to the user');
    }
  });
};

// Lookup all the checks, get their data, send to a validator
workers.gatherAllChecks = function () {
  // Get all the checks
  _data.list('checks', function (err, checks) {
    if (!err && checks && checks.length > 0) {
      checks.forEach(check => {
        // Read in the check data
        _data.read('checks', check, function (err, originalCheckData) {
          if (!err && originalCheckData) {
            // Pass it to the check validator, and let the validator continue or log error
            workers.validateCheckData(originalCheckData);
          } else {
            console.log('Error reading one of the check\'s data')
          }
        });
      });
    } else {
      console.log('Errors: Could not find any checks to process');
    };
  });
};

// Timer to execute the worker-process once per minute
workers.loop = function () {
  setInterval(() => {
    workers.gatherAllChecks();
  }, 1000 * 60);
}

// Init script
workers.init = function () {
  // Execute all the checks immediately
  workers.gatherAllChecks();

  // Call the loop so the checks will execute later on
  workers.loop();
};


// Export the module
module.exports = workers;
