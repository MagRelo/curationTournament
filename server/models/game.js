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
    .lean()
    .then(gameData =>{
      if(!gameData) throw {'error': 'no game'}

      // calc timeRemaining
      const phaseStart = moment(gameData.phaseStartTime)
      const secondsElapsed = moment().diff(phaseStart, 'seconds')
      gameData.timeRemaining = Math.max(gameData.lengthOfPhase - secondsElapsed, -1)

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

      const gameData = array[0]
      const userData = array[1]
      if(!gameData || !userData) throw {'error': 'no game or user'}

      // calc timeRemaining
      const phaseStart = moment(gameData.phaseStartTime)
      const secondsElapsed = moment().diff(phaseStart, 'seconds')
      gameData.timeRemaining = Math.max(gameData.lengthOfPhase - secondsElapsed, -1)

      return {
        'gameData': gameData,
        'userData': userData
      }
    })

}

module.exports = mongoose.model('Game', BaseSchema);
