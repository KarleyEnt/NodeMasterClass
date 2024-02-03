/*
 * Request handlers
 */

// Dependencies
const config = require('./config');
const _data = require('./data');
let helpers = require('./helpers');

// define handlers
const handlers = {};

/*
 *  HTML Handlers
 *
 */

// Index handler
handlers.index = function (data, callback) {
  // Reject any request that isn't a GET
  if (data.method === 'get') {

    // Prepare data for interpolation
    let templateData = {
      'head.title': 'Uptime Monitoring - Made Simple',
      'head.description': 'We offer free simple uptime monitoring for http, https sites for all kinds. When your site goes down we will send you a text to let you know',
      'body.class': 'index'
    };

    // Read in the index template as a string
    helpers.getTemplate('index', templateData, function (err, str) {
      if (!err && str) {
        // Add the universal header and footer
        helpers.addUniversalTemplates(str, templateData, function (err, str) {
          if (!err && str) {
            // Return that page as HTML
            callback(200, str, 'html');
          } else {
            callback(500, undefined, 'html');
          }
        });
      } else {
        callback(500, undefined, 'html');
      }
    });
  } else {
    callback(405, undefined, 'html');
  }
};

// Create account handler
handlers.accountCreate = function (data, callback) {
  // Reject any request that isn't a GET
  if (data.method === 'get') {

    // Prepare data for interpolation
    let templateData = {
      'head.title': 'Create an account',
      'head.description': 'Sign up is easy and only takes a few seconds',
      'body.class': 'accountCreate'
    };

    // Read in the accountCreate template as a string
    helpers.getTemplate('accountCreate', templateData, function (err, str) {
      if (!err && str) {
        // Add the universal header and footer
        helpers.addUniversalTemplates(str, templateData, function (err, str) {
          if (!err && str) {
            // Return that page as HTML
            callback(200, str, 'html');
          } else {
            callback(500, undefined, 'html');
          }
        });
      } else {
        callback(500, undefined, 'html');
      }
    });
  } else {
    callback(405, undefined, 'html');
  }
};

// Create session handler
handlers.sessionCreate = function (data, callback) {
  // Reject any request that isn't a GET
  if (data.method === 'get') {

    // Prepare data for interpolation
    let templateData = {
      'head.title': 'Login to your Account',
      'head.description': 'Please enter your phone number and password to access your account.',
      'body.class': 'sessionCreate'
    };

    // Read in the sessionCreate template as a string
    helpers.getTemplate('sessionCreate', templateData, function (err, str) {
      if (!err && str) {
        // Add the universal header and footer
        helpers.addUniversalTemplates(str, templateData, function (err, str) {
          if (!err && str) {
            // Return that page as HTML
            callback(200, str, 'html');
          } else {
            callback(500, undefined, 'html');
          }
        });
      } else {
        callback(500, undefined, 'html');
      }
    });
  } else {
    callback(405, undefined, 'html');
  }
};

// Favicon
handlers.favicon = function (data, callback) {
  // Reject any request that isn't a GET
  if (data.method === 'get') {
    // Read in the favicons data
    helpers.getStaticAsset('favicon.ico', function (err, faviconData) {
      if (!err && faviconData) {
        // Callback the data
        callback(200, faviconData, 'favicon');
      } else {
        callback(500);
      }
    });
  } else {
    callback(405, undefined, 'html');
  }
};

// Public assets
handlers.public = function (data, callback) {
  // Reject any request that isn't a GET
  if (data.method === 'get') {
    // Get the filename being requested
    let trimmedAssetName = data.trimmedPath.replace('public/', '').trim();
    if (trimmedAssetName.length > 0) {
      // Read in the assets data
      helpers.getStaticAsset(trimmedAssetName, function (err, data) {
        if (!err && data) {
          // Determine the content type and default to plain text
          let contentType = 'plain';
          if (trimmedAssetName.indexOf('.css') > -1) {
            contentType = 'css';
          }
          if (trimmedAssetName.indexOf('.png') > -1) {
            contentType = 'png';
          }
          if (trimmedAssetName.indexOf('.jpeg') > -1) {
            contentType = 'jpeg';
          }
          if (trimmedAssetName.indexOf('.ico') > -1) {
            contentType = 'favicon';
          }
          callback(200, data, contentType);
        } else {
          callback(404);
        }
      });
    } else {

    };
  } else {
    callback(405, undefined, 'html');
  }
};

/*
 *  JSON API Handlers
 *
 */

handlers.sample = function (data, callback) {
  callback(406, { name: 'sample handler' });
};
handlers.ping = function (data, callback) {
  callback(200);
};

// Users
handlers.users = function (data, callback) {
  let acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for users submethods
handlers._users = {};

// Users - post
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = function (data, callback) {
  // Check that all the required fields are filled out
  let firstName =
    typeof data.payload.firstName === 'string' &&
      data.payload.firstName.trim().length > 0
      ? data.payload.firstName
      : false;
  let lastName =
    typeof data.payload.lastName === 'string' &&
      data.payload.lastName.trim().length > 0
      ? data.payload.lastName
      : false;
  let phone =
    typeof data.payload.phone === 'string' &&
      data.payload.phone.trim().length === 10
      ? data.payload.phone
      : false;
  let password =
    typeof data.payload.password === 'string' &&
      data.payload.password.trim().length > 0
      ? data.payload.password
      : false;
  let tosAgreement =
    typeof data.payload.tosAgreement === 'boolean' &&
      data.payload.tosAgreement === true
      ? true
      : false;

  if (firstName && lastName && phone && password && tosAgreement) {
    // Make sure that the user doesnt already exist
    _data.read('users', phone, function (err, data) {
      if (err) {
        // Hash the password
        let hashedPassword = helpers.hash(password);
        if (hashedPassword) {
          // Create user object
          let userObject = {
            firstName,
            lastName,
            phone,
            hashedPassword,
            tosAgreement: true,
          };

          // Store the user
          _data.create('users', phone, userObject, function (err) {
            if (!err) {
              callback(200);
            } else {
              callback(500, { Error: 'Could not create the new user' });
            }
          });
        } else {
          callback(500, { Error: 'Unable to hash password' });
        }
      } else {
        callback(400, { Error: 'User already exists' });
      }
    });
  } else {
    callback(400, { Error: 'Missing required fields' });
  }
};

// Users - get
// Required data: phone
// Optional data: none
handlers._users.get = function (data, callback) {
  // Check that the phone number is valid
  let phone = typeof (data.queryStringObject.phone) === 'string'
    && data.queryStringObject.phone.trim().length === 10
    ? data.queryStringObject.phone
    : false;

  if (phone) {
    // Get the token from the headers
    let token = typeof (data.headers.token) === 'string' ? data.headers.token : false;
    // Verify that the given token is valid for the phone number
    handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
      if (tokenIsValid) {
        _data.read('users', phone, function (err, data) {
          if (!err && data) {
            // removed the hashed password from user object before returning it to requestor
            delete data.hashedPassword;
            callback(200, data);
          } else {
            callback(404, { 'Error': 'User not found' });
          }
        });
      } else {
        callback(403, { 'Error': 'Missing required token in header or it is invalid' });
      }
    });
  } else {
    callback(400, { 'Error': 'Missing required field' });
  }
};

// Users - put
// Required data: phone
// Optional data: firstName, lastName, password (at least one must be specified)
handlers._users.put = function (data, callback) {
  // Check for the requried field
  let phone =
    typeof data.payload.phone === 'string' &&
      data.payload.phone.trim().length === 10
      ? data.payload.phone
      : false;
  // Check for the optional fields
  let firstName =
    typeof data.payload.firstName === 'string' &&
      data.payload.firstName.trim().length > 0
      ? data.payload.firstName
      : false;
  let lastName =
    typeof data.payload.lastName === 'string' &&
      data.payload.lastName.trim().length > 0
      ? data.payload.lastName
      : false;
  let password =
    typeof data.payload.password === 'string' &&
      data.payload.password.trim().length > 0
      ? data.payload.password
      : false;

  // Error if the phone is invalid
  if (phone) {
    // Error if nothing is sent to update
    if (firstName || lastName || password) {
      // Get the token from the headers
      let token = typeof (data.headers.token) === 'string' ? data.headers.token : false;
      // Verify that the given token is valid for the phone number
      handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
        if (tokenIsValid) {
          // Look up the user
          _data.read('users', phone, function (err, userData) {
            if (!err && userData) {
              if (firstName) {
                userData.firstName = firstName;
              }
              if (lastName) {
                userData.lastName = lastName;
              }
              if (password) {
                userData.hashedPassword = helpers.hash(password);
              }
              // Store the new updates
              _data.update('users', phone, userData, function (err) {
                if (!err) {
                  callback(200);
                } else {
                  callback(500, { 'Error': 'Error updating file' });
                }
              });
            } else {
              callback(404, { 'Error': 'User not found' });
            }
          });
        } else {
          callback(403, { 'Error': 'Missing required token in header or it is invalid' });
        }
      });
    } else {
      callback(400, { 'Error': 'Missing fields to update' });
    }
  } else {
    callback(400, { 'Error': 'Missing required field' });
  }
};

// Users - delete
// Required data: phone
handlers._users.delete = function (data, callback) {
  // Check that the phone number is valid
  let phone = typeof (data.queryStringObject.phone) === 'string'
    && data.queryStringObject.phone.trim().length === 10
    ? data.queryStringObject.phone
    : false;

  if (phone) {
    // Get the token from the headers
    let token = typeof (data.headers.token) === 'string' ? data.headers.token : false;
    // Verify that the given token is valid for the phone number
    handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
      if (tokenIsValid) {
        _data.read('users', phone, function (err, userData) {
          if (!err && userData) {
            _data.delete('users', phone, function (err) {
              if (!err) {
                // Delete each of the checks associated with the user
                let userChecks = typeof (userData.checks) === 'object' && userData.checks instanceof Array ? userData.checks : [];
                let checksToDelete = userChecks.length;
                if (checksToDelete > 0) {
                  let checksDeleted = 0;
                  let deletionErrors = false;
                  // Loop through the checks
                  userChecks.forEach((checkId) => {
                    // Delete the check
                    _data.delete('checks', checkId, function (err) {
                      if (err) {
                        deletionErrors = true;
                      }
                      checksDeleted++;
                      if (checksToDelete === checksDeleted) {
                        if (!deletionErrors) {
                          callback(200);
                        } else {
                          callback(500, { 'Error': 'Errors encountered while attempting to delete all of the users checks, all checks may not have been deleted from the system successfully' });
                        }
                      }
                    });
                  });
                } else {
                  callback(200);
                }
              } else {
                callback(500, { 'Error': 'Could not delete the specified user' });
              }
            });
          } else {
            callback(404, { 'Error': 'User not found' });
          }
        });
      } else {
        callback(403, { 'Error': 'Missing required token in header or it is invalid' });
      }
    })
  } else {
    callback(400, { 'Error': 'Missing required field' });
  }
};

// Tokens
handlers.tokens = function (data, callback) {
  let acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
}

// Container for all the tokens submethods
handlers._tokens = {};

// Tokens - post
// Required data: phone, password
// Optional data none
handlers._tokens.post = function (data, callback) {
  let phone =
    typeof data.payload.phone === 'string' &&
      data.payload.phone.trim().length === 10
      ? data.payload.phone
      : false;
  let password =
    typeof data.payload.password === 'string' &&
      data.payload.password.trim().length > 0
      ? data.payload.password
      : false;
  if (phone && password) {
    // Lookup the user that matches that phone number
    _data.read('users', phone, function (err, userData) {
      if (!err && userData) {
        // Hash the sent password and compare it to the password stored in the user object
        let hashedPassword = helpers.hash(password);
        if (hashedPassword === userData.hashedPassword) {
          // if valid, create a new token with a random name. Set expiration date 1 hour in the future
          let tokenId = helpers.createRandomString(20);
          let expires = Date.now() + 1000 * 60 * 60;
          let tokenObject = {
            phone,
            tokenId,
            expires
          };
          _data.create('tokens', tokenId, tokenObject, function (err) {
            if (!err) {
              callback(200, tokenObject);
            } else {
              callback(500, { 'Error': 'Could not create the token' });
            }
          });
        } else {
          callback(400, { 'Error': 'Wrong password' });
        }
      } else {
        callback(404, { 'Error': 'User not found' });
      }
    });
  } else {
    callback(400, { 'Error': 'Missing required fields' });
  };
};

// Tokens - get
// Required details: tokenId
// Optional data: none
handlers._tokens.get = function (data, callback) {
  // Check that the tokenId is valid
  let tokenId = typeof (data.queryStringObject.tokenId) === 'string'
    && data.queryStringObject.tokenId.trim().length === 20
    ? data.queryStringObject.tokenId
    : false;

  if (tokenId) {
    _data.read('tokens', tokenId, function (err, tokenData) {
      if (!err && tokenData) {
        callback(200, tokenData);
      } else {
        callback(404, { 'Error': 'Token not found' });
      }
    });
  } else {
    callback(400, { 'Error': 'Missing required field' });
  }
};

// Tokens - put
// Required details: tokenId, extend
// Optional data: none
handlers._tokens.put = function (data, callback) {
  let tokenId = typeof (data.payload.tokenId) === 'string'
    && data.payload.tokenId.trim().length === 20
    ? data.payload.tokenId
    : false;
  let extend =
    typeof data.payload.extend === 'boolean' &&
      data.payload.extend
      ? data.payload.extend
      : false;

  if (tokenId && extend) {
    // Lookup the token
    _data.read('tokens', tokenId, function (err, tokenData) {
      if (!err && tokenData) {
        // Check to make sur that the token isn't already expired
        if (tokenData.expires > Date.now()) {
          // Set the expiration an hour from now
          tokenData.expires = Date.now() + 1000 * 60 * 60;

          // Store the new updated data
          _data.update('tokens', tokenId, tokenData, function (err) {
            if (!err) {
              callback(200);
            } else {
              callback(500, { 'Error': 'Could not update the token\'s expiration' });
            }
          })
        } else {
          callback(400, { 'Error': 'Token has already expired and can not be extended;' })
        }
      } else {
        callback(404, { 'Error': 'Token does not exist' });
      }
    });
  } else {
    callback(400, { 'Error': 'Missing required fields' });
  }
};

// Tokens - delete
// Required details: tokenId
// Optional details: none
handlers._tokens.delete = function (data, callback) {
  // Check that the phone number is valid
  let tokenId = typeof (data.queryStringObject.tokenId) === 'string'
    && data.queryStringObject.tokenId.trim().length === 20
    ? data.queryStringObject.tokenId
    : false;

  if (tokenId) {
    _data.read('tokens', tokenId, function (err, data) {
      if (!err && data) {
        _data.delete('tokens', tokenId, function (err) {
          if (!err) {
            callback(200);
          } else {
            callback(500, { 'Error': 'Could not delete the specified token' });
          }
        });
      } else {
        callback(404, { 'Error': 'Token not found' });
      }
    });
  } else {
    callback(400, { 'Error': 'Missing required field' });
  }
};

// Verify if a given tokenId is currently valid for a given user
handlers._tokens.verifyToken = function (tokenId, phone, callback) {
  // Lookup the token
  _data.read('tokens', tokenId, function (err, tokenData) {
    if (!err && tokenData) {
      // Check that the token is for the given user and hasn't expired
      if (tokenData.phone === phone && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

// Checks
handlers.checks = function (data, callback) {
  let acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._checks[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for all the checks methods
handlers._checks = {};

// Checks - post
// Required details: protocol(http or https), url, method(post, put etc), successCodes, timeoutSeconds
// Optional data: None
handlers._checks.post = function (data, callback) {
  // Validate all the inputs
  let protocol =
    typeof data.payload.protocol === 'string' &&
      ['https', 'http'].indexOf(data.payload.protocol) > -1
      ? data.payload.protocol
      : false;
  let url =
    typeof data.payload.url === 'string' &&
      data.payload.url.trim().length > 0
      ? data.payload.url
      : false;
  let method =
    typeof data.payload.method === 'string' &&
      ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1
      ? data.payload.method
      : false;
  let successCodes =
    typeof data.payload.successCodes === 'object' &&
      data.payload.successCodes instanceof Array &&
      data.payload.successCodes.length > 0
      ? data.payload.successCodes
      : false;
  let timeoutSeconds =
    typeof data.payload.timeoutSeconds === 'number' &&
      data.payload.timeoutSeconds % 1 === 0 &&
      data.payload.timeoutSeconds >= 1 &&
      data.payload.timeoutSeconds <= 5
      ? data.payload.timeoutSeconds
      : false;

  if (protocol && url && method && successCodes && timeoutSeconds) {
    // Get the token from the headers
    let token = typeof (data.headers.token) === 'string' ? data.headers.token : false;

    // Lookup the user by reading the token 
    _data.read('tokens', token, function (err, tokenData) {
      if (!err && tokenData) {
        let userPhone = tokenData.phone;
        // lookup the user data
        _data.read('users', userPhone, function (err, userData) {
          if (!err && userData) {
            let userChecks = typeof (userData.checks) === 'object' && userData.checks instanceof Array ? userData.checks : [];
            // Verify userChecks lenght < max number of checks
            if (userChecks.length < config.maxChecks) {
              // Create a random id for the check
              let checkId = helpers.createRandomString(20);

              // Create the check object and include the user\'s phone
              let checkObject = {
                id: checkId,
                userPhone,
                protocol,
                url,
                method,
                successCodes,
                timeoutSeconds
              };
              // Save the checkObject
              _data.create('checks', checkId, checkObject, function (err) {
                if (!err) {
                  // Add the checkId to the user's object
                  userData.checks = userChecks;
                  userData.checks.push(checkId);

                  // Save the new user data
                  _data.update('users', userPhone, userData, function (err) {
                    if (!err) {
                      // Return the data about the new check
                      callback(200, checkObject);
                    } else {
                      callback('500', { 'Error': 'Could not update the user with the new check' });
                    }
                  });
                } else {
                  callback(500, { 'Error': 'Could not create the new check' });
                }
              });
            } else {
              callback(400, { 'Error': `The user already has the max no of checks ${config.maxChecks}` });
            }
          } else {
            callback(403);
          }
        });
      } else {
        callback(403);
      };
    });
  } else {
    callback(400, { 'Error': 'Missing required inputs or inputs are invalid' });
  }
};

// Checks - get
// Required data: id
// Optional data: none
handlers._checks.get = function (data, callback) {
  // Check that the phone number is valid
  let id = typeof (data.queryStringObject.id) === 'string'
    && data.queryStringObject.id.trim().length === 20
    ? data.queryStringObject.id
    : false;

  if (id) {
    // Lookup the check
    _data.read('checks', id, function (err, checkData) {
      if (!err && checkData) {
        // Get the token from the headers
        let token = typeof (data.headers.token) === 'string' ? data.headers.token : false;
        // Verify that the given token is valid and belongs to the user who created the check
        handlers._tokens.verifyToken(token, checkData.userPhone, function (tokenIsValid) {
          if (tokenIsValid) {
            callback(200, checkData);
          } else {
            callback(403, { 'Error': 'Missing required token in header or it is invalid' });
          }
        });
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { 'Error': 'Missing required field' });
  }
};

// Checks - put
// Required data: id
// Optional data: protocol,url,method,successCodes,timeoutSeconds (one must be sent)
handlers._checks.put = function (data, callback) {
  // Check for the requried field
  let id =
    typeof data.payload.id === 'string' &&
      data.payload.id.trim().length === 20
      ? data.payload.id
      : false;
  // Check for the optional fields
  let protocol =
    typeof data.payload.protocol === 'string' &&
      ['https', 'http'].indexOf(data.payload.protocol) > -1
      ? data.payload.protocol
      : false;
  let url =
    typeof data.payload.url === 'string' &&
      data.payload.url.trim().length > 0
      ? data.payload.url
      : false;
  let method =
    typeof data.payload.method === 'string' &&
      ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1
      ? data.payload.method
      : false;
  let successCodes =
    typeof data.payload.successCodes === 'object' &&
      data.payload.successCodes instanceof Array &&
      data.payload.successCodes.length > 0
      ? data.payload.successCodes
      : false;
  let timeoutSeconds =
    typeof data.payload.timeoutSeconds === 'number' &&
      data.payload.timeoutSeconds % 1 === 0 &&
      data.payload.timeoutSeconds >= 1 &&
      data.payload.timeoutSeconds <= 5
      ? data.payload.timeoutSeconds
      : false;


  // Error if the phone is invalid
  if (id) {
    // Error if nothing is sent to update
    if (protocol || url || method || successCodes || timeoutSeconds) {
      // Lookup the check
      _data.read('checks', id, function (err, checkData) {
        if (!err && checkData) {
          // Get the token from the headers
          let token = typeof (data.headers.token) === 'string' ? data.headers.token : false;
          // Verify that the given token is valid and belongs to the user who created the check
          handlers._tokens.verifyToken(token, checkData.userPhone, function (tokenIsValid) {
            if (tokenIsValid) {
              // Update the check where necessary
              if (protocol) {
                checkData.protocol = protocol;
              }
              if (url) {
                checkData.url = url;
              }
              if (method) {
                checkData.method = method;
              }
              if (successCodes) {
                checkData.successCodes = successCodes;
              }
              if (timeoutSeconds) {
                checkData.timeoutSeconds = timeoutSeconds;
              }
              // Store the new updates
              _data.update('checks', id, checkData, function (err) {
                if (!err) {
                  callback(200);
                } else {
                  callback(500, { 'Error': 'Error updating file' });
                }
              });
            } else {
              callback(403, { 'Error': 'Missing required token in header or it is invalid' });
            }
          });
        } else {
          callback(400, { 'Error': 'Check id does not exist' });
        }
      })
    } else {
      callback(400, { 'Error': 'Missing fields to update' });
    }
  } else {
    callback(400, { 'Error': 'Missing required field' });
  }
};

// Checks - delete
// Required data: id
// Optional data: none
handlers._checks.delete = function (data, callback) {
  // Check that the id is valid
  let id = typeof (data.queryStringObject.id) === 'string'
    && data.queryStringObject.id.trim().length === 20
    ? data.queryStringObject.id
    : false;

  if (id) {
    // Lookup the check
    _data.read('checks', id, function (err, checkData) {
      if (!err && checkData) {
        // Get the token from the headers
        let token = typeof (data.headers.token) === 'string' && data.headers.token.trim().length === 20 ? data.headers.token : false;
        // Verify that the given token is valid and is of theuser
        handlers._tokens.verifyToken(token, checkData.userPhone, function (tokenIsValid) {
          if (tokenIsValid) {
            _data.delete('checks', id, function (err) {
              if (!err) {
                // Lookup the user
                _data.read('users', checkData.userPhone, function (err, userData) {
                  if (!err && userData) {
                    let userChecks = typeof (userData.checks) === 'object' && userData.checks instanceof Array ? userData.checks : [];
                    // Remove the deleted check from their list of checks
                    let checkPosition = userChecks.indexOf(id);
                    if (checkPosition > -1) {
                      userChecks.splice(checkPosition, 1);
                      // Resave the users data
                      _data.update('users', checkData.userPhone, userData, function (err) {
                        if (!err) {
                          callback(200);
                        } else {
                          callback(500, { 'Error': 'Could not update the user' });
                        }
                      });
                    } else {
                      callback(500, { 'Error': 'Could not find the check on the user\'s object' });
                    }
                  } else {
                    callback(500, { 'Error': 'Could not find the user who created the check, so could not remove the check from the list of the user object' });
                  }
                });
              } else {
                callback(500, { 'Error': 'Could not delete the checkId' });
              }
            });
          } else {
            callback(403, { 'Error': 'Missing required token in header or it is invalid' });
          }
        })
      } else {
        callback(400, { 'Error': 'This check id does not exist' });
      }
    });
  } else {
    callback(400, { 'Error': 'Missing required field' });
  }
};

module.exports = handlers;
