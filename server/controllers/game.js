const fetch = require('request-promise')
const moment = require('moment')

const config = require('../config/environment')

const GameSchema = require('../models/game')
const Game = require('mongoose').model('Game')

exports.createGame = (req, res) => {
  const newGame = new GameSchema({})

  newGame.save()
    .then(gameDoc => {
      res.json(gameDoc)
    })
    .catch(error => {
      res.status(500).json({error: error})
    })

}

exports.listGames = (req, res) => {
  GameSchema.find({'status.gameComplete': false})
    .then(gameDoc => {
      res.json(gameDoc)
    })
    .catch(error => {
      res.status(500).json({error: error})
    })

}

exports.handleUpdate = (game, socket, data) => {
  Game.updateAndFetch(socket.gameId)
    .then(gameDoc => Promise.resolve(game.emit('update', gameDoc)) )
    .catch(error => Promise.resolve(game.emit('error', error)))
}

exports.handlePropsal = (game, socket, data) => {
  GameSchema.findById(socket.gameId)
    .then(gameDoc => {

      if(!gameDoc){throw {error: 'no game'}}
      const currentRound = gameDoc.status.currentRound
      // validate round
      if(data.round !== currentRound){
        console.log('wrong round', data.round, currentRound)
        throw {error: 'wrong round'}
      }
      // validate action: get from internal array
      // validate target: get from internal array

      return gameDoc.addProposal(socket.userId, data)
    })
    .then(updatedGame => {
      return Game.updateAndFetch(socket.gameId)
    })
    .then(updatedGame => {
      return Promise.resolve(game.emit('update', updatedGame))
    })
    .catch(error => {
      console.log(error)
      return Promise.resolve(game.emit('error', error))
    })
}

exports.handleVote = (game, socket, data) => {

  GameSchema.findById(socket.gameId).lean()
    .then(gameDoc => {

      if(!gameDoc){throw {error: 'no game'}}
      const currentRound = gameDoc.status.currentRound
      // validate round
      if(data.round !== currentRound){
        console.log('wrong round', data.round, currentRound)
        throw {error: 'wrong round'}
      }
      // validate action: get from internal array
      // validate target: get from internal array


      return Game.addProposal(socket.userId, data)
    })
    .then(updatedGame => {
      return Game.updateAndFetch(socket.gameId)
    })
    .then(updatedGame => {
      return Promise.resolve(game.emit('update', updatedGame))
    })
    .catch(error => {
      console.log(error)
      return Promise.resolve(game.emit('error', error))
    })
}
