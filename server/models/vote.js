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


VoteSchema.statics.addVote = function(userAddress, data){

  // insert prediction and add to game
  return this.findOneAndUpdate(
    {
      userAddress: userAddress,
      predictionId: data.predictionID
    },
    {
      gameId: data.gameId,
      predictionId: data.proposalID,
      userAddress: userAddress,
      signature: data.signature,
      vote: data.vote,
      outcome: null
    },
    {upsert: true, new: true}
  )
}



module.exports = mongoose.model('Vote', VoteSchema);
