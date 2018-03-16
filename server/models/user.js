'use strict';

var utils = require('../config/utils')

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var UserSchema = new Schema({
  userAddress: String,
  points: Number
});

module.exports = mongoose.model('User', UserSchema);
