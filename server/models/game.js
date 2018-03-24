'use strict';
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
const bluebird = require('bluebird')
const moment = require('moment')

const QuestionSchema = require('../models/question')
const UserSchema = require('../models/user')
const ContractSchema = require('../models/contract')

var GameSchema =  new Schema({

    contract: {type: Schema.Types.ObjectId, ref: 'Contract'},

    currentQuestion: {type: Schema.Types.ObjectId, ref: 'Question'},
    questionStartTime: {type: Date},
    phase: {type: String, default: 'ready'},
    lengthOfPhase: {type: Number, default: 15},
    phaseStartTime: {type: Date},

    active: {type: Boolean, default: true},
  },
  {timestamps: true}
);


GameSchema.statics.addGame = function(options){

  // add contract
  ContractSchema.initContract()

  // add game

  // next question(?)

}

GameSchema.methods.nextQuestion = function(){

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

GameSchema.statics.nextPhase = function(phase){

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

GameSchema.statics.userData = function(userAddress){

  return bluebird.all([
      this.findOne({'active': true})
        .populate({ path: 'currentQuestion', model: 'Question', select: '_id question options' })
        .populate({ path: 'contributors', model: 'User', select: 'userAddress points' })
        .lean(),
      UserSchema.findOne({'userAddress': userAddress})
    ])
    .then(array =>{

      const gameData = array[0]
      const userData = array[1]
      if(!gameData) throw {'error': 'no game data'}

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

module.exports = mongoose.model('Game', GameSchema);
