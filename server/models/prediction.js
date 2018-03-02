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
    outcome: Boolean,
    votes: [{type: Schema.Types.ObjectId, ref: 'Vote'}]
  },
  {timestamps: true}
);


PredictionSchema.statics.addProposal = function(userAddress, data){

  // insert prediction and add to game
  return this.findOneAndUpdate(
    {
      userAddress: userAddress,
      gameId: data.gameId,
      round: data.currentRound
    },
    {
      userAddress: userAddress,
      gameId: data.gameId,
      round: data.currentRound,
      type: 'proposal',
      action: data.action,
      target: data.target,
      signature: data.signature,
      outcome: null
    },
    {upsert: true, new: true}
  )
}



PredictionSchema.statics.closeVotes = function(gameId, round) {

  // get predictions and w/ votes
  return this.find({_id: gameId, round: round})
    .populate({path: 'votes', model: 'Vote', select: 'round type action target'})
    .then(predictions => {

      // tally votes
      const closedPredictions = predictions.map(prediction => {
        prediction.outcome = prediction.votes.reduce((total, item) => {
          return total + item.vote
        }, 0)
        return prediction
      })

      // update predictions array

    })
    .then(results => {
      // get game again
    })
    .then(results => {
      // order predctions
    })

};


module.exports = mongoose.model('Prediction', PredictionSchema);
