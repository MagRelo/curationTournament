'use strict';
const jsonInterface = require('../../build/contracts/Servesa.json')
const util = require('../config/setupContract.js')
const TruffleContract = require("truffle-contract");


var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ContractSchema = new Schema({

    // init
    game: [{type: Schema.Types.ObjectId, ref: 'Game'}],
    contractNetwork: {type: String},
    contractAddress: {type: String},

    // contract data, set once
    ownerAddress: {type: String},
    oracleAddress: {type: String},
    minDeposit: {type: Number},

    // contract data, watch for updates
    contractValue: {type: String},
    contributors: [{type: Schema.Types.ObjectId, ref: 'User'}],

});

ContractSchema.statics.initContract = function (contractNetwork, contractAddress){

  // setup mongo model data
  const newContract = new this({
    'contractNetwork': contractNetwork,
    'contractAddress': contractAddress,
  })

  return newContract.save()
    .then(result => {

      // instantiate truffle contract
      const servesaContract = util.setupTruffleContract(contractNetwork, jsonInterface)

      // get initial data from ethereum contract
      return servesaContract.deployed()
        .then(instance => {

          // call ethereum contract's getter functions
          return bluebird.all([
            instance.ownerAddress(),
            instance.oracleAddress(),
            instance.minDeposit(),
            instance.contractValue(),
          ])
        })

    })
    .then(array => {

      // update contract data
      this.ownerAddress = array[0],
      this.oracleAddress = array[1],
      this.minDeposit = array[2],
      this.contractValue = array[3]

      return this.save()
    })

}

module.exports = mongoose.model('Contract', ContractSchema);
