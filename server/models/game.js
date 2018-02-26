'use strict';
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const moment = require('moment')
const sigUtil = require('eth-sig-util')

var GameSchema = new Schema({
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
  playerList: [],
  candidateList: [],
  itemList: [],
  rounds: [{
    index: Number,
    roundNumber: Number,
    proposalsClosed: Boolean,
    votesClosed: Boolean
  }],
  predictions: []
});


GameSchema.methods.addProposal = function(data){

  // TODO check address against whitelist
  if(!data.userAddress){
    throw {error: 'bad user'}
  }

  // validate signature
  if(!validProposalSignature(data.userAddress, data.proposalAction, data.proposalTarget, data.signature)){
    throw {error: 'bad signature'}
  }

  // validate round
  if(data.currentRound !== this.status.currentRound ||
    this.rounds[this.status.currentRound].meta.proposalsClosed){
    throw {error: 'wrong round/proposals closed'}
  }

  // add proposal
  this.predictions.push(data)

  return this.save()
}

GameSchema.methods.addVote = function(userId, data){

  // const roundData = this.rounds[this.status.currentRound]
  // const existingProposalIndex = roundData.vote.findIndex(proposal => {return proposal.userId === userId})
  // if (existingProposalIndex > -1 ) {
  //   roundData.proposals[proposalIndex] = {
  //     userId: userId,
  //     round: currentRound,
  //     action: data.proposalAction,
  //     target: data.proposalTarget
  //   }
  // } else {
  //   roundData.proposals.push({
  //     userId: userId,
  //     round: currentRound,
  //     action: data.proposalAction,
  //     target: data.proposalTarget
  //   })
  // }
  // this.rounds[currentRound] = roundData

  return this.save()
}


GameSchema.statics.updateAndFetch = function(gameId) {

  return this.findOne({_id: gameId})
    .then(gameDoc => {

      // STATUS
      if(gameDoc.status.gameInProgress){
        // gameDoc.status = updateStatus(gameDoc.status, gameDoc.config)
      }

      // ROUNDS
      // if (gameDoc.status.closeRound){
      //   const roundData = gameDoc.status.rounds[gameDoc.status.currentRound]
      //   roundData.proposalsClosed = true
      //   roundData.votesClosed = true
      //   gameDoc.rounds[currentRound] = roundData
      // }

      // PUBLIC
      gameDoc.public.status = gameDoc.status
      gameDoc.public.itemList = gameDoc.itemList
      gameDoc.public.candidateList = gameDoc.candidateList
      gameDoc.public.playerList = gameDoc.playerList
      gameDoc.public.rounds = gameDoc.rounds
      gameDoc.publc.proposals = gameDoc.predictions.map(proposal => {
        return {
          userAddress: proposal.userAddress,
          submitted: !!proposal.action
        }
      })

      return gameDoc.save()
    })
    .then(savedDoc => {
      return this.findOne({_id: gameId}, {public: 1})
    })

};



module.exports = mongoose.model('Game', GameSchema);

// Helpers
// --------------
//
function updateStatus(currentStatus, config){
  const phaseStart = moment(currentStatus.phaseStartTime)
  const secondsElapsed = moment().diff(phaseStart, 'seconds')
  const timeRemaining = config.lengthOfPhase - secondsElapsed
  const lengthOfPhase = config.lengthOfPhase

  // default to current phase
  let status = {
    "currentRound" : currentStatus.currentRound,
    "currentPhase" : currentStatus.currentPhase,
    "phaseStartTime": currentStatus.phaseStartTime,
    "timeRemaining" : timeRemaining,
    "gameInProgress": true
  }

  // end game
  if(timeRemaining <= 0
    && currentStatus.currentPhase === 'results'
    && currentStatus.currentRound + 1 >= config.rounds){
      console.log('Game Over:', currentStatus.currentRound + 1, '>', config.rounds);
      status.currentPhase = 'complete'
      status.gameInProgress = false
      status.gameComplete = true
  }

  // transition to next phase
  if(timeRemaining <= 0
    && status.gameInProgress){
      console.log('transition from: ', currentStatus.currentRound,'-', currentStatus.currentPhase);
      status = transitionStatus(currentStatus, config.lengthOfPhase)
  }

  return status
}
function transitionStatus(currentStatus, lengthOfPhase){

  const newStartTime = new Date()
  let newPhase = ''
  let newRound = currentStatus.currentRound
  let closeRound = false

  if(currentStatus.currentPhase === 'proposals'){ newPhase = 'votes' }
  if(currentStatus.currentPhase === 'votes'){ newPhase = 'results' }
  if(currentStatus.currentPhase === 'results'){
    newPhase = 'proposals'
    newRound =  parseInt(currentRound, 10) + 1
    closeRound = true
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


function validProposalSignature(userAddress, action, target, signature){

  const msgParams = [{
    name: 'Proposal',
    type: 'string',
    value: action + ' ' + target.symbol
  }]
  const recoveredAddress = sigUtil.recoverTypedSignature({
    data: msgParams,
    sig: signature
  })

  // if it matches then we have a valid sig.
  return (recoveredAddress === userAddress)

}
