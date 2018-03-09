'use strict';
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
const bluebird = require('bluebird')


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

GameSchema.statics.closeRound = function(gameId){

  let gameDoc = null

  // get predictions
  return this.findOne({_id: gameId})
      .populate({
        path: 'predictions',
        model: 'Prediction',
        select: '_id action target round userAddress value',
        match: {action: {$ne: 'pass'}},
        populate: {
          path: 'votes',
          model: 'Vote',
          select: 'vote userAddress'
        }
      })
      .then(gameDocResult => {
        if(!gameDocResult){return console.log('no gameDoc!', gameId)}

        // pass out of closure
        gameDoc = gameDocResult

        let promiseArray = []
        gameDoc.predictions.forEach(prediction => {
          // execute closeVote on all
          promiseArray.push(prediction.tallyVote())
        })

        return bluebird.all(promiseArray)
      })
      .then(array => {

        // rank by agreement
        array.sort(function (a, b) {
          return b.agreement - a.agreement;
        })

        // mark top three
        const passNumber = 1
        for(let i = 0; i < array.length; i++){
          // true == success; top three succeed
          array[i].outcome = (i < passNumber)
        }

        // save
        let promiseArray = []
        array.forEach(prediction => {
          // save outcome of each prediction
          promiseArray.push(prediction.save())
        })

        return bluebird.all(promiseArray)
      })
      .then(predictions => {

        // update game doc with results
        predictions
          .filter(prediction => {return (prediction.round === gameDoc.status.currentRound)})
          .forEach(prediction => {

          // successful proposal
          if(prediction.outcome){

            // add item to list
            gameDoc.itemList.push(prediction.target)

            // find player that proposed it
            const playerAddressIndex = gameDoc.playerList
              .map(playerObj => playerObj.userAddress.toLowerCase())
              .indexOf(prediction.userAddress.toLowerCase())

            // credit player
            gameDoc.playerList[playerAddressIndex].chips += prediction.value
          }

        })

        // update playerBalances for votes

        // for each player
          // get player vote

          // loop throu each propsal
            // get consensus
            // check vote against outcome


        // update status
        gameDoc.status = transitionStatus(gameDoc.status, 30, gameDoc.config.rounds)

        return gameDoc.save()
      })


}

GameSchema.statics.updateAndFetch = function(gameId, userAddress) {

  return this.findOne({_id: gameId})
      .populate({
        path: 'predictions',
        model: 'Prediction',
        select: '_id action target round userAddress outcome agreement',
        match: {action: {$ne: 'pass'}},
        populate: {
          path: 'votes',
          model: 'Vote',
          select: 'vote userAddress'
        }
      })
      .then(gameDoc => {
        if(!gameDoc){return console.log('no gameDoc!', gameId)}

        let needsSave, needsCalculate = false

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

        // check of max time has elapsed
        const phaseStart = moment(gameDoc.status.phaseStartTime)
        const secondsElapsed = moment().diff(phaseStart, 'seconds')
        const phaseExpired = ((gameDoc.config.lengthOfPhase - secondsElapsed) < 0)

        // update time remaining
        gameDoc.status.timeRemaining = gameDoc.config.lengthOfPhase - secondsElapsed

        // transition Status
        if(gameDoc.status.currentPhase === 'proposals' && (proposalsComplete || phaseExpired)){
          console.log(gameDoc.status.currentRound, '- proposals done');
          gameDoc.status = transitionStatus(gameDoc.status, 30, gameDoc.config.rounds)
          return gameDoc.save()
        }

        if(gameDoc.status.currentPhase === 'votes' && (votesComplete || phaseExpired)){
          console.log(gameDoc.status.currentRound, '- votes done');
          return this.closeRound(gameDoc._id)
        }

        if(gameDoc.status.currentPhase === 'results' && phaseExpired){
          console.log(gameDoc.status.currentRound, '- results done');
          gameDoc.status = transitionStatus(gameDoc.status, 30, gameDoc.config.rounds)
          return gameDoc.save()
        }

        // default to just pass gameDoc as-is
        return Promise.resolve(gameDoc)
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
          outcome: prediction.outcome,
          agreement: prediction.agreement,
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
function transitionStatus(currentStatus, lengthOfPhase, maxRounds){

  const newStartTime = new Date()
  let newPhase = ''
  let newRound = currentStatus.currentRound
  let gameInProgress = true
  let gameComplete = false

  if(currentStatus.currentPhase === 'proposals'){
    console.log('transition to votes');
    newPhase = 'votes'
  }
  if(currentStatus.currentPhase === 'votes'){
    console.log('transition to results');
    newPhase = 'results'
  }
  if(currentStatus.currentPhase === 'results'){

    if(currentStatus.currentRound + 1 < maxRounds){
      // continue game, increment round
      console.log('transition to results');
      newPhase = 'proposals'
      newRound =  parseInt(currentStatus.currentRound, 10) + 1

    } else {
      // end game
      newPhase = 'complete'
      gameInProgress = false
      gameComplete = true
    }

  }

  return {
    currentRound: newRound,
    currentPhase: newPhase,
    phaseStartTime: newStartTime.toISOString(),
    timeRemaining: lengthOfPhase,
    gameReady: false,
    gameInProgress: gameInProgress,
    gameComplete: gameComplete
  }

}
