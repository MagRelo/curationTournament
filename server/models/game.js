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
      timedGame: {type: Boolean, default: false},
      lengthOfPhase: {type: Number, default: 15},
      contractAddress: {type: String},
      contractNetwork: {type: String},
      contractValue: {type: String},
    },
    status: {
      gameState: {type: String, default: 'ready'},
      currentRound: {type: Number, default: 0},
      phaseStartTime: {type: Date},
      timeRemaining: {type: Number, default: 30},
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

            // TODO Removes

            // find player that proposed it
            const playerAddressIndex = gameDoc.playerList
              .map(playerObj => playerObj.userAddress.toLowerCase())
              .indexOf(prediction.userAddress.toLowerCase())
            const playerObject = gameDoc.playerList[playerAddressIndex]

            // credit player
            playerObject.chips += prediction.value
            gameDoc.playerList[playerAddressIndex] = playerObject
          }

        })

        // update playerBalances for votes

        // for each player
          // get player vote

          // loop throu each propsal
            // get consensus
            // check vote against outcome


        const newPhaseTime = new Date()
        gameDoc.status.phaseStartTime = newPhaseTime.toISOString()
        gameDoc.status.timeRemaining = gameDoc.config.lengthOfPhase
        gameDoc.status.gameState = 'results'

        // update status
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
        if(!gameDoc){throw {error: 'no gameDoc!', id: gameId}}

        // get status
        const currentProposals = gameDoc.predictions
          .filter(prediction => {
            return (prediction.round === gameDoc.status.currentRound)
          })


        const proposalsComplete = false
        const votesComplete = false
        // const proposalsComplete = (currentProposals.length === gameDoc.playerList.length)
        // const votesComplete = currentProposals
        //   .every(prediction => {
        //     return (prediction.votes.length === gameDoc.playerList.length)
        //   })

        // check if max time has elapsed
        const phaseStart = moment(gameDoc.status.phaseStartTime)
        const secondsElapsed = moment().diff(phaseStart, 'seconds')
        const phaseExpired = ((gameDoc.config.lengthOfPhase - secondsElapsed) < 0)
        gameDoc.status.timeRemaining = Math.max(gameDoc.config.lengthOfPhase - secondsElapsed, -1)

        // switch on game state
        switch (gameDoc.status.gameState) {
          case 'ready':

            // start phases
            const newPhaseTime = new Date()
            gameDoc.status.phaseStartTime = newPhaseTime.toISOString()
            gameDoc.status.timeRemaining = gameDoc.config.lengthOfPhase
            gameDoc.status.gameState = 'proposals'
            return gameDoc.save()

            break;
          case 'proposals':

            if(proposalsComplete || phaseExpired){
              console.log('Round ' + gameDoc.status.currentRound + ': proposals done');

              const newPhaseTime = new Date()
              gameDoc.status.phaseStartTime = newPhaseTime.toISOString()
              gameDoc.status.timeRemaining = gameDoc.config.lengthOfPhase
              gameDoc.status.gameState = 'voting'
              return gameDoc.save()
            }

            break;
          case 'voting':

            if(votesComplete || phaseExpired){
              console.log('Round ' + gameDoc.status.currentRound + ': votes done');
              return this.closeRound(gameDoc._id)
            }

            break;
          case 'results':

            if(phaseExpired){
              console.log('Round ' + gameDoc.status.currentRound + ': results done');


              // close game?
              if(gameDoc.status.currentRound + 1 >= gameDoc.config.rounds){
                gameDoc.status.timeRemaining = 0
                gameDoc.status.gameState = 'closed'
                return gameDoc.save()
              }

              // change phase, increment round
              const newPhaseTime = new Date()
              gameDoc.status.phaseStartTime = newPhaseTime.toISOString()
              gameDoc.status.timeRemaining = gameDoc.config.lengthOfPhase
              gameDoc.status.gameState = 'proposals'
              gameDoc.status.currentRound = gameDoc.status.currentRound + 1
              return gameDoc.save()

            }

            break;
          case 'closed':
            console.log('game closed');
            break;
          default:
            console.log('default');
        }

        // default to just pass gameDoc as-is
        return gameDoc.save()
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
  let gameState = currentStatus.gameState

  return {
    currentRound: newRound,
    gameState: newPhase,
    phaseStartTime: newStartTime.toISOString(),
    timeRemaining: lengthOfPhase,
    gameReady: false,
    gameState: gameState
  }

}
