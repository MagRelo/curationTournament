'use strict';

var utils = require('../config/utils')
const sigUtil = require('eth-sig-util')


var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var AnswerSchema = new Schema({
    gameId: {type: Schema.Types.ObjectId, ref: 'Game'},
    questionId: {type: Schema.Types.ObjectId, ref: 'Question'},
    userAddress: String,
    signature: String,
    answerIndex: Number,
    descriptionString: String,
    outcome: Boolean
  },
  {timestamps: true}
);


AnswerSchema.statics.addAnswer = function(userAddress, data){

  // insert prediction and add to game
  return this.findOneAndUpdate(
    {
      gameId: data.gameId,
      questionId: data.questionId,
      userAddress: userAddress,
    },
    {
      gameId: data.gameId,
      questionId: data.questionId,
      userAddress: userAddress,
      signature: data.signature,
      answerIndex: data.answerIndex,
      descriptionString: data.descriptionString
    },
    {upsert: true, new: true}
  )
}

module.exports = mongoose.model('Prediction', AnswerSchema);
