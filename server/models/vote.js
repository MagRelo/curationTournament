'use strict';

var utils = require('../config/utils')

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var VoteSchema = new Schema({
    gameId: {type: Schema.Types.ObjectId, ref: 'Game'},
    predictionId: {type: Schema.Types.ObjectId, ref: 'Prediction'},
    userAddress: String,
    signature: String,
    vote: Boolean,
    outcome: Boolean
  },
  {timestamps: true}
);


module.exports = mongoose.model('Vote', VoteSchema);
