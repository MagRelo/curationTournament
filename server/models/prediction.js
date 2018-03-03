'use strict';

var utils = require('../config/utils')
const sigUtil = require('eth-sig-util')


var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var PredictionSchema = new Schema({
    gameId: {type: Schema.Types.ObjectId, ref: 'Game'},
    round: Number,
    userAddress: String,
    signature: String,
    target: Object,
    action: String,
    votes: [{type: Schema.Types.ObjectId, ref: 'Vote'}],
    yesVotes: Number,
    outcome: Boolean,
  },
  {timestamps: true}
);


PredictionSchema.statics.addProposal = function(userAddress, data){

  // insert prediction and add to game
  return this.findOneAndUpdate(
    {
      userAddress: userAddress,
      gameId: data.gameId,
      round: data.round
    },
    {
      userAddress: userAddress,
      gameId: data.gameId,
      round: data.round,
      type: 'proposal',
      action: data.action,
      target: data.target,
      signature: data.signature,
      outcome: null
    },
    {upsert: true, new: true}
  )
}

PredictionSchema.statics.tallyVote = function(predictionId) {

  // get predictions and w/ votes
  return this.find({_id: predictionId})
    .populate({path: 'votes', model: 'Vote', select: 'vote'})
    .then(prediction => {

      // tally votes
      prediction.yesVotes = prediction.votes.reduce((total, item) => {
        return total + item.vote
      }, 0)

      // save
      return prediction.save()
    })

};


module.exports = mongoose.model('Prediction', PredictionSchema);
