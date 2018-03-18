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

      const totalVotes = countArray.reduce((total, item) => {return total + item}, 0)
      let highScore = 0

      // calc scores and get highest score
      countArray.forEach((count, i) => {

        // get consensus
        const agreement = (count / totalVotes)

        // set consensus
        this.options[i].agreement = agreement

        // get high score to mark winners later (and include ties)
        if(agreement > highScore){
          highScore = agreement
        }

      })

      // set winner(s)
      this.options.forEach((option, i) => {

        if(highScore === option.agreement){

          // mark as winner
          this.options[i].outcome = true

          // save winning index(es) for bulk update later
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
      return AnswerSchema.find(
        {'questionId': this._id, 'answerIndex': {'$in': winningIndices} }
      )

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
