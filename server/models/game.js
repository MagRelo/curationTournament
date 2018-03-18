'use strict';
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
const bluebird = require('bluebird')
const moment = require('moment')

const QuestionSchema = require('../models/question')
const UserSchema = require('../models/user')

var BaseSchema =  new Schema({
    active: {type: Boolean, default: true},
    lengthOfPhase: {type: Number, default: 15},
    contractAddress: {type: String}, // from ENV
    contractNetwork: {type: String}, // from ENV

    // contract data, update on interval
    ownerAddress: {type: String},
    oracleAddress: {type: String},
    contractValue: {type: String},
    minDeposit: {type: Number},
    contributors: [{type: Schema.Types.ObjectId, ref: 'User'}],

    // game data - push
    currentQuestion: {type: Schema.Types.ObjectId, ref: 'Question'},
    questionStartTime: {type: Date},
    phase: {type: String, default: 'ready'},
    phaseStartTime: {type: Date},
  },
  {timestamps: true}
);

BaseSchema.methods.nextQuestion = function(){

  // get oldest unused question
  return QuestionSchema.findOne({'hasBeenUsed': false}).sort({"createdAt": 1}).limit(1)
    .then(question => {
      if(!question) throw {'error': 'no question'}

      const start = new Date()
      this.currentQuestion = question._id
      this.questionStartTime = start
      this.phase = 'question'
      this.phaseStartTime = start

      return this.save()
    })

}

BaseSchema.statics.nextPhase = function(phase){

    return this.findOne({'active': true})
      .populate({
        path: 'currentQuestion',
        model: 'Question',
        select: '_id question options'
      })
      .then(gameDoc => {

        if(gameDoc.phase === 'question'){

          // calculate results for current question & advance phase
          return gameDoc.currentQuestion.calculateAnswers()
            .then(results => {

              const start = new Date()
              gameDoc.phase = 'results'
              gameDoc.phaseStartTime = start

              return gameDoc.save()
            })

        } else {

          // advance to next question
          return gameDoc.nextQuestion()
        }

      })

}

BaseSchema.statics.publicData = function(){

  return this.findOne({'active': true})
    .populate({ path: 'currentQuestion', model: 'Question', select: '_id question options' })
    .populate({ path: 'contributors', model: 'User', select: 'userAddress points' })
    .then(gameData =>{
      if(!gameData) throw {'error': 'no question'}
      return {
        gameData: gameData,
        userData: null
      }
    })

}

BaseSchema.statics.userData = function(userAddress){

  return bluebird.all([
      this.findOne({'active': true})
        .populate({ path: 'currentQuestion', model: 'Question', select: '_id question options' })
        .populate({ path: 'contributors', model: 'User', select: 'userAddress points' }),
      UserSchema.findOne({'userAddress': userAddress})
    ])
    .then(array =>{
      if(!array[0] || !array[1]) throw {'error': 'no game or user'}
      return {
        gameData: array[0],
        userData: array[1]
      }
    })

}

BaseSchema.statics.updateAndFetch = function(gameId, userAddress) {

  return this.findOne({_id: gameId})
      .populate({
        path: 'predictions',
        model: 'Prediction',
        select: '_id action target round userAddress outcome agreement value',
        match: {action: {$ne: 'pass'}},
        populate: {
          path: 'votes',
          model: 'Vote',
          select: 'vote userAddress outcome'
        }
      })
      .then(gameDoc => {
        if(!gameDoc){throw {error: 'no gameDoc!', id: gameId}}

        // get status
        const currentProposals = gameDoc.predictions
          .filter(prediction => {
            return (prediction.round === gameDoc.status.currentRound)
          })

        // setup how rounds advance
        const phaseStart = moment(gameDoc.status.phaseStartTime)
        const secondsElapsed = moment().diff(phaseStart, 'seconds')

        let phaseExpired = false
        let proposalsComplete = false
        let votesComplete = false

        // advance on timer for timed games & for results phase
        if(gameDoc.config.timedGame || gameDoc.status.gameState === 'results'){
          phaseExpired = ((gameDoc.config.lengthOfPhase - secondsElapsed) < 0)
          gameDoc.status.timeRemaining = Math.max(gameDoc.config.lengthOfPhase - secondsElapsed, -1)
        } else {
          proposalsComplete = (currentProposals.length === gameDoc.playerList.length)
          votesComplete = currentProposals
            .every(prediction => {
              return (prediction.votes.length === gameDoc.playerList.length)
            })
        }

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

              // tally votes
              let promiseArray = []
              gameDoc.predictions.forEach(prediction => { promiseArray.push(prediction.tallyVote()) })
              return bluebird.all(promiseArray)
                .then(predictions => {

                  // sort predictions by level of agreement
                  predictions.sort(function (a, b) { return b.agreement - a.agreement })

                  // mark top x
                  const passNumber = 1
                  for(let i = 0; i < predictions.length; i++){
                    // true == success
                    predictions[i].outcome = (i < passNumber)
                  }

                  // save outcomes of votes
                  let promiseArray = []
                  predictions.forEach(prediction => {
                    prediction.votes.forEach(vote => {
                      vote.outcome = prediction.outcome
                    })

                    promiseArray.push(prediction.save())
                  })

                  return bluebird.all(promiseArray)
                })
                .then(predictions => {
                  return PredictionSchema.find({gameId: gameDoc._id})
                    .populate({
                      path: 'votes',
                      model: 'Vote',
                      select: '_id vote outcome'
                    })
                })
                .then(predictions => {
                  let promiseArray = []
                  predictions.forEach(prediction => {

                    // correct vote == consensus
                    const correctVote = (prediction.agreement >= 0.5)

                    prediction.votes.forEach(vote => {
                      vote.outcome = (vote.vote === correctVote)
                      promiseArray.push(vote.save())
                    })

                  })

                  return bluebird.all(promiseArray)
                })
                .then(predictions => {
                  return PredictionSchema.find({gameId: gameDoc._id})
                    .populate({
                      path: 'votes',
                      model: 'Vote',
                      select: '_id vote outcome userAddress'
                    })
                })
                .then(predictions => {

                  // update game doc with results
                  predictions
                    .filter(prediction => {return (prediction.round === gameDoc.status.currentRound)})
                    .forEach(prediction => {

                    // successful proposal
                    if(prediction.outcome){

                      if(prediction.action === 'add'){
                        // add item to list
                        gameDoc.itemList.push(prediction.target)
                      } else {
                        // remove from list
                        const itemIndex = gameDoc.itemList.indexOf(prediction.target.symbol)
                        gameDoc.itemList.splice(itemIndex, 1)
                      }

                      // find player that proposed it
                      const playerAddressIndex = gameDoc.playerList
                        .map(playerObj => playerObj.userAddress.toLowerCase())
                        .indexOf(prediction.userAddress.toLowerCase())
                      const playerObject = gameDoc.playerList[playerAddressIndex]

                      // credit player
                      playerObject.chips += prediction.value
                      gameDoc.playerList[playerAddressIndex] = playerObject
                    }


                    // credit players for votes
                    prediction.votes.forEach(vote =>{
                      if(vote.outcome){
                        const playerAddressIndex = gameDoc.playerList
                          .map(playerObj => playerObj.userAddress.toLowerCase())
                          .indexOf(vote.userAddress.toLowerCase())
                        const playerObject = gameDoc.playerList[playerAddressIndex]

                        // credit player
                        playerObject.chips += 10
                        gameDoc.playerList[playerAddressIndex] = playerObject
                      }
                    })

                  })

                  const newPhaseTime = new Date()
                  gameDoc.status.phaseStartTime = newPhaseTime.toISOString()
                  gameDoc.status.timeRemaining = gameDoc.config.lengthOfPhase
                  gameDoc.status.gameState = 'results'

                  // update status
                  return gameDoc.save()
                })

            }

            break;
          case 'results':

            if(phaseExpired){
              console.log('Round ' + gameDoc.status.currentRound + ': results done');

              // close game?
              if(gameDoc.status.currentRound + 1 >= gameDoc.config.rounds){

                gameDoc.status.timeRemaining = 0
                gameDoc.status.gameState = 'closed'

              } else {
                // change phase, increment round
                const newPhaseTime = new Date()
                gameDoc.status.phaseStartTime = newPhaseTime.toISOString()
                gameDoc.status.timeRemaining = gameDoc.config.lengthOfPhase
                gameDoc.status.gameState = 'proposals'
                gameDoc.status.currentRound = gameDoc.status.currentRound + 1

              }

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
        return gameDoc
      })
      .then(gameDoc => {
        return publicData(gameDoc, userAddress)
      })


};

module.exports = mongoose.model('Game', BaseSchema);
