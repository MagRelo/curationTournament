'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const bluebird = require('bluebird')

const AnswerSchema = require('../models/answer')
const UserSchema = require('../models/user')

var QuestionSchema = new Schema({
    question: String,
    options: [{
      name: String,
      imgUrl: String,
      agreement: Number,
      outcome: Boolean
    }],
    answers: [{type: Schema.Types.ObjectId, ref: 'Answer'}],
    hasBeenUsed: {type: Boolean, default: false}
  },
  {timestamps: true}
);

QuestionSchema.methods.calculateAnswers = function(){

  let winningIndices = []

  // get answers (4 queries?)
  const promiseArray = []
  this.options.forEach((option, index) => {
    promiseArray.push(
      AnswerSchema.find({questionId: this._id, 'answerIndex': index}).count()
    )
  })

  return bluebird.all(promiseArray)
    .then(countArray => {

      // [12, 45, 100, 444]
      const totalVotes = countArray.reduce((total, item) => {return total + item}, 0)
      const agreementArray = countArray.map((count, index) => {
        return {
          votes: count,
          agreement: (count / totalVotes),
          outcome: null
        }
      })

      // get high score (to capture ties)
      let highScore = 0
      agreementArray.forEach(option => {
        if(option.agreement > highScore){
          highScore = option.agreement
        }
      })

      // mark winner(s)
      let promiseArray = []
      agreementArray.forEach(option => {
        if(highScore === option.agreement){
          option.outcome = true
        }
      })

      // set this.option[x].agreement
      this.options.forEach((option, i) => {
        this.options[i].agreement = agreementArray[i].agreement
        this.options[i].outcome = agreementArray[i].outcome

        // mark winning indeces for bulk update later
        if(agreementArray[i].outcome){
          winningIndices.push(i)
        }
      })

      // save question
      return this.save()
    })
    .then(questionDoc => {

      // mark correct answers
      return AnswerSchema.update(
        { 'questionId': this._id, 'answerIndex': {'$in': winningIndices} },
        { '$set': {'outcome': true} },
        { 'multi': true }
      )

    })
    .then(answers => {

      // get winning answers
      return AnswerSchema.find({'questionId': this._id, 'answerIndex': {'$in': winningIndices} })
    })
    .then(answers => {

      // get winning player ids
      let winningUserAddressArray = answers.map(answer => answer.userAddress)

      // update all winning players
      return UserSchema.update(
        { 'userAddress': {'$in': winningUserAddressArray } },
        { '$inc': {'points': 10} },
        { 'multi': true }
      )

    })

}

module.exports = mongoose.model('Question', QuestionSchema);
