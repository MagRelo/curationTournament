'use strict';

var utils = require('../config/utils')

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var PredictionSchema = new Schema({
  userAddress: String,
  gameId: String,
  round: Number,
  type: String,
  action: String,
  target: Object,
  outcome: Boolean
});


module.exports = mongoose.model('Prediction', PredictionSchema);
