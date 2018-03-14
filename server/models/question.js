'use strict';

var utils = require('../config/utils')

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var QuestionSchema = new Schema({
    prompt: String,
    options: {
      1: {},
      2: {},
      3: {},
      4: {}
    },
    playerAnswers: [{}],
    results: {
      1: Number,
      2: Number,
      3: Number,
      4: Number
    },
    winner: Number
  },
  {timestamps: true}
);

module.exports = mongoose.model('Vote', QuestionSchema);
