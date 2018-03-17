'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var AnswerSchema = new Schema({
    gameId: {type: Schema.Types.ObjectId, ref: 'Game'},
    questionId: {type: Schema.Types.ObjectId, ref: 'Question'},
    userAddress: String,
    signature: String,
    answerIndex: Number,
    questionString: String,
    outcome: Boolean
  },
  {timestamps: true}
);


AnswerSchema.statics.addAnswer = function(userAddress, data){

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
      questionString: data.questionString
    },
    {upsert: true, new: true}
  )
}

module.exports = mongoose.model('Answer', AnswerSchema);
