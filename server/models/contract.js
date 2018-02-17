'use strict';

var utils = require('../config/utils')

const crypto = require('crypto');
const mongoosastic = require('mongoosastic')
const config = require('../config/environment/');

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ContractSchema = new Schema({
  contractOptions: Object,
  deployedAddress: String,
  deployedNetwork: String,
  timestamp: Date
});

// add elastic connection
ContractSchema.plugin(mongoosastic, {
  host: config.elasticSearch_HOST,
  port: config.elasticSearch_PORT,
  index: 'contracts',
  type: 'mongo'
})

module.exports = mongoose.model('Contract', ContractSchema);
