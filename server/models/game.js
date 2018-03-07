'use strict';
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const PredictionSchema = require('../models/prediction')

const moment = require('moment')

var GameSchema =  new Schema({
    config: {
      ownerAddress: {type: String},
      oracleAddress: {type: String},
      name: {type: String},
      rounds: {type: Number},
      minDeposit: {type: Number},
      lengthOfPhase: {type: Number, default: 30}
    },
    status: {
      currentRound: {type: Number, default: 0},
      currentPhase: {type: String, default: 'proposals'},
      phaseStartTime: {type: Date, default: ()=>{
        const now = new Date
        return moment(now).add(10, 'm').toDate()
      }},
      timeRemaining: {type: Number, default: 30},
      gameReady: {type: Boolean, default: false},
      gameInProgress: {type: Boolean, default: false},
      gameComplete: {type: Boolean, default: false}
    },
    rounds: [{
      index: Number,
      roundNumber: Number,
      proposalsClosed: Boolean,
      votesClosed: Boolean
    }],
    playerList: [],
    candidateList: [],
    itemList: [],
    predictions: [{type: Schema.Types.ObjectId, ref: 'Prediction'}]
  },
  {timestamps: true}
);


GameSchema.statics.updateAndFetch = function(gameId, userAddress) {

  return this.findOne({_id: gameId})
      .populate({
        path: 'predictions',
        model: 'Prediction',
        select: '_id action target round userAddress',
        match: {action: {$ne: 'pass'}},
        populate: {
          path: 'votes',
          model: 'Vote',
          select: 'vote userAddress'
        }
      })
      .then(gameDoc => {
        if(!gameDoc){return console.log('no gameDoc!', gameId)}

        let needsSave = false

        // get status
        const currentProposals = gameDoc.predictions
          .filter(prediction => {
            return (prediction.round === gameDoc.status.currentRound)
          })
        const proposalsComplete = (currentProposals.length === gameDoc.playerList.length)
        const votesComplete = currentProposals
          .every(prediction => {
            return (prediction.votes.length === gameDoc.playerList.length)
          })

        // transition Status
        if(gameDoc.status.currentPhase === 'proposals' && proposalsComplete){

          gameDoc.status = transitionStatus(gameDoc.status, 30)
          needsSave = true
        }
        if(gameDoc.status.currentPhase === 'votes' && votesComplete){

          console.log('calculate');

          gameDoc.status = transitionStatus(gameDoc.status, 30)
          needsSave = true
        }
        if(gameDoc.status.currentPhase === 'results'){
          // gameDoc.status = transitionStatus(gameDoc.status, 30)
        }


        if(needsSave){
          return gameDoc.save()
        } else {
          return Promise.resolve(gameDoc)
        }
      })
      .then(gameDoc => {
        return publicData(gameDoc, userAddress)
      })


};

module.exports = mongoose.model('Game', GameSchema);

// Helpers
// --------------
function publicData(gameDoc, userAddress){

    // only include data for this user & round
    const userAddressCompare = userAddress ? userAddress.toLowerCase() : ''
    const userProposals = gameDoc.predictions
      .filter(prediction => {
        return (prediction.userAddress === userAddressCompare &&
          prediction.round === gameDoc.status.currentRound)
      })

    // publicify data
    return {
      config: gameDoc.config,
      status: gameDoc.status,
      itemList: gameDoc.itemList,
      candidateList: gameDoc.candidateList,
      playerList: gameDoc.playerList,
      rounds: gameDoc.rounds,
      predictions: gameDoc.predictions.map(prediction => {
        return {
          _id: prediction._id,
          round: prediction.round,
          action: prediction.action,
          target: prediction.target,
          descriptionString: prediction.descriptionString,
          userVoted: prediction.votes.some(vote => {
            return vote.userAddress === userAddressCompare
          }),
          vote: userVote(userAddressCompare, prediction.votes)
        }
      }),
      userData: {
        proposal: userProposals[0]
      }
    }

}
function userVote(userAddress, votesArray){
  let userVote = null
  votesArray.forEach(vote => {
    if(vote.userAddress === userAddress){
      userVote = vote.vote
    }
  })
  return userVote
}
function transitionStatus(currentStatus, lengthOfPhase){

  const newStartTime = new Date()
  let newPhase = ''
  let newRound = currentStatus.currentRound

  if(currentStatus.currentPhase === 'proposals'){
    console.log('transition to votes');
    newPhase = 'votes'
  }
  if(currentStatus.currentPhase === 'votes'){
    console.log('transition to results');
    newPhase = 'results'
  }
  if(currentStatus.currentPhase === 'results'){
    console.log('transition to results');
    newPhase = 'proposals'
    newRound =  parseInt(currentRound, 10) + 1
  }

  return {
    "currentPhase": newPhase,
    "currentRound": newRound,
    "phaseStartTime": newStartTime.toISOString(),
    "timeRemaining" : lengthOfPhase,
    "gameInProgress": true
  }
}
