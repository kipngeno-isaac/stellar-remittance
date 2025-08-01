const MyAppModel = require('../config/db');

let User = new MyAppModel({tableName: "users"});

module.exports = User;