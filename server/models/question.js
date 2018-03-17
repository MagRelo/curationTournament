'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const AnswerSchema = require('../models/answer')

var QuestionSchema = new Schema({
    question: String,
    options: [{
      name: String,
      imgUrl: String,
      agreement: Number
    }],
    answers: [{type: Schema.Types.ObjectId, ref: 'Answer'}],
    winningAnswerIndex: {type: Number, default: null},
    hasBeenUsed: {type: Boolean, default: false}
  },
  {timestamps: true}
);

QuestionSchema.methods.calculateAnswers = function(){

  // get answers (4 queries?)
  const promiseArray = []
  this.options.forEach((option, index) => {
    promiseArray.push(
      Answer.find({questionId: this._id, 'answerIndex': index}).count()
    )
  })

  return promiseArray
    .then(optionArray => {

      // [12, 45, 100, 444]
      const totalVotes = optionArray.reduce((total, item) => {total + item}, 0)

      const agreementArray = optionArray.map((count, index) => {
        return {
          index: index,
          votes: count,
          agreement: (count / totalVotes)
        }
      })

      // sort by agreement, get top

      // set this.option[x].agreement, this.winningAnswerIndex

      // [update all answers & question]

      // [select winning answers by qId & outcome]

      // [update players]

    })

}

module.exports = mongoose.model('Question', QuestionSchema);
