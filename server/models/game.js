'use strict';
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const PredictionSchema = require('../models/prediction')

const moment = require('moment')

var GameSchema =  new Schema({
    config: {
      rounds: {type: Number, default: 3},
      lengthOfPhase: {type: Number, default: 30},
      tournamentStart: {type: Date, default: ()=>{
        const now = new Date
        return moment(now).add(10, 'm').toDate()
      }}
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
        if(!gameDoc){return console.log('no gameDoc!', gameId);}

        // check status
        // const playerCount = gameDoc.playerList.length
        // const round = gameDoc.status.currentRound
        // const phase = gameDoc.status.currentPhase
        // const roundPredictions = gameDoc.predictions
        //   .filter(prediction => prediction.round === gameDoc.status.currentRound)
        //   .length


        const userAddressCompare = userAddress ? userAddress.toLowerCase() : ''

        // only include data for this user & round
        const userProposals = gameDoc.predictions
          .filter(prediction => {
            return (prediction.userAddress === userAddressCompare &&
              prediction.round === gameDoc.status.currentRound)
          })

        // publicify data
        return {
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
      })

};

module.exports = mongoose.model('Game', GameSchema);

// Helpers
// --------------
//


function userVote(userAddress, votesArray){

  let userVote = null
  votesArray.forEach(vote=>{
    if(vote.userAddress === userAddress){
      userVote = vote.vote
    }
  })

  return userVote
}

function updateStatus(currentStatus, config){

  // const phaseStart = moment(currentStatus.phaseStartTime)
  // const secondsElapsed = moment().diff(phaseStart, 'seconds')
  // const timeRemaining = config.lengthOfPhase - secondsElapsed
  // const lengthOfPhase = config.lengthOfPhase
  //
  // default to current phase
  let status = {
    "currentRound" : currentStatus.currentRound,
    "currentPhase" : currentStatus.currentPhase,
    "phaseStartTime": currentStatus.phaseStartTime,
    "timeRemaining" : timeRemaining,
    "gameInProgress": true
  }

  // // end game
  // if(timeRemaining <= 0
  //   && currentStatus.currentPhase === 'results'
  //   && currentStatus.currentRound + 1 >= config.rounds){
  //     console.log('Game Over:', currentStatus.currentRound + 1, '>', config.rounds);
  //     status.currentPhase = 'complete'
  //     status.gameInProgress = false
  //     status.gameComplete = true
  // }
  //
  // // transition to next phase
  // if(timeRemaining <= 0
  //   && status.gameInProgress){
  //     console.log('transition from: ', currentStatus.currentRound,'-', currentStatus.currentPhase);
  //     status = transitionStatus(currentStatus, config.lengthOfPhase)
  // }

  status = transitionStatus(currentStatus, config.lengthOfPhase)

  return status
}

function transitionStatus(currentStatus, lengthOfPhase){

  const newStartTime = new Date()
  let newPhase = ''
  let newRound = currentStatus.currentRound
  let closeRound = false

  if(currentStatus.currentPhase === 'proposals'){ newPhase: 'votes' }
  if(currentStatus.currentPhase === 'votes'){ newPhase: 'results' }
  if(currentStatus.currentPhase === 'results'){
    newPhase: 'proposals'
    newRound:  parseInt(currentRound, 10) + 1
    closeRound: true
  }

  return {
    closeRound: closeRound,
    "currentPhase": newPhase,
    "currentRound": newRound,
    "phaseStartTime": newStartTime.toISOString(),
    "timeRemaining" : lengthOfPhase,
    "gameInProgress": true
  }
}
