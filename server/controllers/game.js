const fetch = require('request-promise')
const moment = require('moment')
const sigUtil = require('eth-sig-util')

const config = require('../config/environment')

const VoteModel = require('../models/vote')
const PredictionModel = require('../models/prediction')
const GameSchema = require('../models/game')

const Game = require('mongoose').model('Game')

exports.createGame = (req, res) => {
  const newGame = new GameSchema({})

  // validate input
  const options = req.body

  newGame.config.name = options.name
  newGame.config.ownerAddress = options.contractOwner
  newGame.config.oracleAddress = options.oracleAddress
  newGame.config.minDeposit = options.minDeposit
  newGame.config.rounds = options.rounds
  newGame.config.timedGame = options.timedGame

  newGame.rounds = buildRounds(options.rounds)
  newGame.playerList = buildPlayerList(options.playerList)

  // TODO testing
  newGame.candidateList = candidateList

  newGame.save()
    .then(gameDoc => { res.json(gameDoc) })
    .catch(error => { res.status(500).json({error: error}) })

}

exports.listGames = (req, res) => {
  GameSchema.find({})
    .then(gameDoc => { res.json(gameDoc) })
    .catch(error => {
      console.log(error.message);
      res.status(500).json({error: error})
    })

}

exports.handleUpdate = (game, socket, data) => {
  Game.updateAndFetch(data.gameId, data.userAddress)
    .then(gameDoc => Promise.resolve(game.emit('update', gameDoc)) )
    .catch(error => {
      console.log(error)
      return Promise.resolve(game.emit('error', error))
    })
}

exports.handleVote = (game, socket, data) => {

  let predictionDoc, userAddress

    GameSchema.findById(data.gameId)
      .then(gameDoc => {
        if(!gameDoc){throw {error: 'no game'}}

        // setup signature data
        const msgParams = [
          {
            name: 'Proposal',
            type: 'string',
            value: data.descriptionString
          },
          {
            name: 'Your vote',
            type: 'string',
            value: (data.vote ? 'Agree':'Disagree')
          },
          {
            name: 'Proposal ID',
            type: 'string',
            value: data.proposalId
          }
      ]

        // recover account that signed signature
        userAddress = sigUtil.recoverTypedSignature({
          data: msgParams,
          sig: data.signature
        })

        // validate account against whitelist
        if(!userAddress || !playerOnList(userAddress, gameDoc.playerList)){
          throw {error: 'bad user'}
        }

        // validate round
        if(gameDoc.rounds[gameDoc.status.currentRound].votesClosed){
          throw {error: 'wrong round/voting closed'}
        }

        return PredictionModel.findById(data.proposalId)
      })
      .then(prediction => {
        predictionDoc = prediction

        return VoteModel.addVote(userAddress, data)
      })
      .then(voteResponse => {

        // TODO this seems whack

        // add vote to prediction
        if(!~predictionDoc.votes.indexOf(voteResponse._id)){
          predictionDoc.votes.push(voteResponse._id)
        }

        // save prediction
        return predictionDoc.save()
      })
      .then(updatedGame => {
        return Game.updateAndFetch(data.gameId, userAddress)
      })
      .then(updatedGame => {
        return Promise.resolve(game.emit('update', updatedGame))
      })
      .catch(error => {
        console.log(error)
        return Promise.resolve(game.emit('error', error))
      })


}
