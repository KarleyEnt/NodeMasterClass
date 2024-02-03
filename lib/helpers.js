/*
 * helpers for various task
 *
 */

// Dependencies
let querystring = require('querystring');
let crypto = require('crypto');
let config = require('./config');
let https = require('https');
const path = require('path');
const fs = require('fs');

// Container for all the helpers
let helpers = {};


// Create a SHA256 hash
helpers.hash = function(str) {
  if(typeof(str) === 'string' && str.length > 0) {
    let hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
    return hash;
  } else {
    return false;
  }
};

// Parse a JSON string to an object in all cases, without throwing an error 
helpers.parseJsonToObject = function(str) {
  try {
    let obj = JSON.parse(str);
    return obj;
  } catch(e) {
    return {}
  };
};

// Create a random string of random alphanumeric characters, of a given length
helpers.createRandomString = function(strLength) {
  strLength = typeof(strLength) === 'number' && strLength > 0 ? strLength : false;
  if(strLength) {
    // Define all the possibile characters that could go into string
    let possibileCharacters = 'bcdefghijklmnopqrstuvwxyz0123456789';

    // Start the final string
    let str = '';
    for(let i = 0; i < strLength; i++){
      // Get a random character from the possibleCharacters string
      let randomCharacter = possibileCharacters[Math.floor(Math.random() * possibileCharacters.length)];
      // Append this character to the final string
      str += randomCharacter;
    }
    return str;
  } else {
    return false;
  }
};

// Send a SMS via twilio
helpers.sendTwilioSms = function(phone, msg, callback){
  // Validate the parameters
  phone = typeof(phone) === 'string' && phone.trim().length === 10 ? phone.trim() : false;
  msg = typeof(msg) === 'string' && msg.trim().length > 0 && msg.trim().length < 1600 ? msg : false;
  if(phone &&  msg){
    // Configure the request payload
    const payload = {
      'From': config.twilio.fromPhone,
      'To': '+1'+phone,
      'Body': msg
    };

    // Stringify the payload
    let stringPayload = querystring.stringify(payload);

    // Configure the request details
    let requestDetails = {
      'protocol': 'https:',
      'host': 'api.twilio.com',
      'method': 'POST',
      'path': '/2010-04-01/Accounts/'+config.twilio.accountSid+'/Messages.json',
      'auth': config.twilio.accountSid+':'+config.twilio.authToken,
      'headers': {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(stringPayload),
      }
    };
    // Instantiate the request object
    let req = https.request(requestDetails, function(res){
      // Grab the status of the res object
      let status = res.statusCode;
      // Callback successfully if the request went through
      if(status === 200 || status === 201){
        callback(false);
      } else {
        callback('Status code returned was '+status);
      }
    });

    // Bind to the error event so it does not get thrown
    req.on('error', function(e){
      callback(e)
    });

    // Add the payload
    req.write(stringPayload);

    // End the request
    req.end();
  } else {
    callback('Missing or invalid inputs');
  }

};

// Get the string content of a template
helpers.getTemplate = function(templateName, data, callback){
  data = typeof(data) === 'object' && data !== null ? data : {};
  templateName = typeof(templateName) === 'string' && templateName.length > 0 ? templateName : false;
  if(templateName) {
    let templates = path.join(__dirname,'/../templates/');
    fs.readFile(templates+templateName+'.html','utf-8', function(err, str){
      if(!err && str && str.length > 0) {
        // Interpolation on the string
        let finalString = helpers.interpolate(str, data);
        callback(false, finalString);
      } else {
        callback('Could not find the template');
      }
    });
  } else {
    callback('A valid template name was not specified');
  }
}

// Add the universal header and the footer to a string, and pass provided data object to the header and footer for interpolation
helpers.addUniversalTemplates = function(str, data, callback){
  str = typeof(str) === 'string' && str.length > 0 ? str : '';
  data = typeof(data) === 'object' && data !== null ? data : {};

  // Get the header
  helpers.getTemplate('_header', data, function(err, headerString){
    if(!err && headerString) {
      // Get the footer
      helpers.getTemplate('_footer', data, function(err, footerString){
        if(!err && headerString){
          // Add them all together
          let fullString = headerString + str + footerString;
          callback(false, fullString);
        } else {
          callback('Could not find the footer template');
        }
      });
    } else {
      callback('Could not find the header template');
    }
  });

};

// Take a given string and a date object and find/replace
helpers.interpolate = function(str, data){
  str = typeof(str) === 'string' && str.length > 0 ? str : '';
  data = typeof(data) === 'object' && data !== null ? data : {};

  // Add the templateGlobals to the data object, prepending their key name with "global"
  for(let keyName in config.templateGlobals) {
    if(config.templateGlobals.hasOwnProperty(keyName)){
      data['global.'+keyName] = config.templateGlobals[keyName];
    }
  }
  // For each key in the data object, insert its value into the string at the corresponding placeholder
  for(let key in data) {
    if(data.hasOwnProperty(key) && typeof(data[key] == 'string')){
      let replace = data[key];
      let find = '{'+key+'}';
      str = str.replace(find,replace);
    }
  };
  return str;
};

// Get the contents of the static aka public asset
helpers.getStaticAsset = function(fileName, callback) {
  fileName = typeof(fileName) === 'string' && fileName.length > 0 ? fileName : false;
  if(fileName) {
    let publicDir = path.join(__dirname,'/../public/');
    fs.readFile(publicDir+fileName, function(err, data){
      if(!err && data) {
        callback(false, data);
      } else {
        callback('No file could be found');
      }
    });
  } else {
    callback('A valid filename was not specified');
  }
}

module.exports = helpers;
