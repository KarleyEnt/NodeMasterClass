const { MongoClient } = require("mongodb");
// Replace the uri string with your connection string.
const uri = "mongodb+srv://anant:mongo@topbl.c005arj.mongodb.net/?retryWrites=true&w=majority";

let setup = {};

setup.client = new MongoClient(uri);
setup.database = setup.client.db('nodeMasterClassDetails');


setup.users = setup.database.collection('users');

module.exports = setup;