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
    descriptionString: String,
    target: Object,
    action: String,
    value: Number,
    votes: [{type: Schema.Types.ObjectId, ref: 'Vote'}],
    agreement:  Number,
    outcome: Boolean
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
      value: 100,
      signature: data.signature,
      descriptionString: data.descriptionString
    },
    {upsert: true, new: true}
  )
}

PredictionSchema.methods.tallyVote = function(){

  // tally votes
  const yesVotes = this.votes.reduce((total, item) => {
    return total + item.vote
  }, 0)

  // calculate level of consensus
  if(this.votes.length){
    this.agreement = Number((Math.round((yesVotes / this.votes.length) + "e" + 2)  + "e-" + 2));
  }

  // save
  return this.save()

};


module.exports = mongoose.model('Prediction', PredictionSchema);
