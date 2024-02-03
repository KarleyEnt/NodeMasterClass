// library for storing and editing data

// dependencies
let fs = require('fs');
let path = require('path');
let helpers = require('./helpers');

// Container for the module (to be exported)
let lib = {};

// base directory of the data folder
lib.baseDir = path.join(__dirname, '/../.data/')

// Write data to a file
lib.create = function (dir, file, data, callback) {
  // open the file for writing
  fs.open(lib.baseDir + dir + '/' + file + '.json', 'wx', function (err, fileDescriptor) {
    if (!err && fileDescriptor) {
      // Convert data to string
      let stringData = JSON.stringify(data);

      // Write to file and close it
      fs.writeFile(fileDescriptor, stringData, function (err) {
        if (!err) {
          fs.close(fileDescriptor, function (err) {
            if (!err) {
              callback(false);
            } else {
              callback('error closing new file');
            }
          });
        } else {
          callback('Error writing to new file');
        }
      });
    } else {
      callback('Could not create a new file, it may already exist');
    }
  });
};

// Write data to MongoDBFile
lib.createM = async function (collection, data, callback) {
  try {
    await collection.insertOne(data);
    callback(false);
  } catch (error) {
    console.log('E', error);
    callback('Error storing data');
  }
};

// Read data from a file
lib.read = function (dir, file, callback) {
  fs.readFile(lib.baseDir + dir + '/' + file + '.json', 'utf8', function (err, data) {
    let parsedData
    if (!err && data) {
      parsedData = helpers.parseJsonToObject(data);
    }
    callback(err, parsedData);
  })
};

// Read data from MongoDBFile
lib.readM = async function (collection, queryKey, queryParam, callback) {
  try {
    let query = { [queryKey]: queryParam }
    let userData = await collection.findOne(query);
    callback(false, userData);
  } catch (error) {
    callback('Error retreiving data')
  }
};

// update data inside a file
lib.update = function (dir, file, data, callback) {
  // Open the file for writing
  fs.open(lib.baseDir + dir + '/' + file + '.json', 'r+', function (err, fileDescriptor) {
    if (!err && fileDescriptor) {
      // Convert data to string
      let stringData = JSON.stringify(data);
      // Truncate the file
      fs.ftruncate(fileDescriptor, function (err) {
        if (!err) {
          // write to file and close it
          fs.writeFile(fileDescriptor, stringData, function (err) {
            if (!err) {
              fs.close(fileDescriptor, function (err) {
                if (!err) {
                  callback(false);
                } else {
                  callback('Error closing the file');
                }
              });
            } else {
              callback('Error writing to exisiting file');
            }
          });
        } else {
          callback('Unable to truncate file');
        }
      });
    } else {
      callback('Could not open file for updating, it may not exist yet');
    }
  });
};

// delete a file
lib.delete = function (dir, file, callback) {
  // unlike the file
  fs.unlink(lib.baseDir + dir + '/' + file + '.json', function (err) {
    if (!err) {
      callback(false);
    } else {
      callback('Error deleting file');
    }
  });
};

// list all the items in a directory
lib.list = function (dir, callback) {
  fs.readdir(lib.baseDir + dir + '/', function (err, data) {
    if (!err && data && data.length > 0) {
      let trimmedFileNames = [];
      data.forEach((fileName) => {
        trimmedFileNames.push(fileName.replace('.json', ''));
        callback(false, trimmedFileNames);
      });
    } else {
      callback(err);
    };
  });
};

//Export the module
module.exports = lib;