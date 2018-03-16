'use strict';
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
const bluebird = require('bluebird')
const moment = require('moment')

var BaseSchema =  new Schema({
    contractAddress: {type: String}, // from ENV
    contractNetwork: {type: String}, // from ENV
    lengthOfPhase: {type: Number, default: 15}, // from ENV
    active: {type: Boolean, default: true},

    // contract data, update on interval
    ownerAddress: {type: String},
    oracleAddress: {type: String},
    contractValue: {type: String},
    minDeposit: {type: Number},
    contributors: [{type: Schema.Types.ObjectId, ref: 'User'}],

    // game data - push
    state: {type: String, default: 'ready'},
    currentQuestion: {type: Schema.Types.ObjectId, ref: 'Question'},
    questionStartTime: {type: Date},
    phase: {type: String},
    phaseStartTime: {type: Date},
  },
  {timestamps: true}
);

BaseSchema.methods.nextQuestion = function(){

  // get oldest unused question
  return Question.findOne({'hasBeenUsed': false}).sort({"createdAt": 1}).limit(1)
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

BaseSchema.methods.nextPhase = function(phase){

  if(this.phase === 'question'){

    return Question.calculateAnswers(this.currentQuestion)
      .then(results => {

        const start = new Date()
        this.phase = 'results'
        this.phaseStartTime = start

        return this.save()
      })

  } else {

    return this.nextQuestion()
  }


}

BaseSchema.statics.publicData = function(){

  return this.findOne({'active': true})
    .populate({
      path: 'currentQuestion',
      model: 'Question',
      select: '_id question options'
    })
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
        .populate({
          path: 'currentQuestion',
          model: 'Question',
          select: '_id question options'
        }),
      User.findOne({'userAddress': userAddress})
    ])
    .then(array =>{
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
          userVote: userVote(userAddressCompare, prediction.votes),
          userPayout: userPayout(userAddressCompare, prediction.votes)
        }
      }),
      userData: {
        proposal: userProposals[0],
        userVotes: userVotes(userAddressCompare, gameDoc.predictions)
      }
    }

}
function userVotes(userAddress, predictions){
  let userVotes = []
  predictions.forEach(prediction => {
    prediction.votes.forEach(vote => {
      if(userAddress === vote.userAddress){
        userVotes.push(vote)
      }
    })
  })
  return userVotes
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
function userPayout(userAddress, votesArray){
  let userPayout = null
  votesArray.forEach(vote => {
    if(vote.userAddress === userAddress){
      userPayout = vote.outcome ? 10 : 0
    }
  })
  return userPayout
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
