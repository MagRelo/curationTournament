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

  newGame.playerList = buildPlayerList(options.playerList)

  // TODO testing
  // newGame.candidateList = candidateList

  newGame.save()
    .then(gameDoc => { res.json(gameDoc) })
    .catch(error => { res.status(500).json({error: error}) })

}
//
// exports.listGames = (req, res) => {
//   GameSchema.find({})
//     .then(gameDoc => { res.json(gameDoc) })
//     .catch(error => {
//       console.log(error.message);
//       res.status(500).json({error: error})
//     })
//
// }

exports.requestData = (game, socket, data) => {

  // if socket has auth => userData
  if(socket.auth){
    return Game.userData(socket.auth.userAddress)
      .then(gameDoc => Promise.resolve(game.emit('update', gameDoc)) )
      .catch(error => {
        console.log(error)
        return Promise.resolve(game.emit('error', error))
      })
  }

  // no auth => public data
  return Game.publicData()
    .then(gameDoc => Promise.resolve(game.emit('update', gameDoc)) )
    .catch(error => {
      console.log(error)
      return Promise.resolve(game.emit('error', error))
    })

}

exports.handleVote = (game, socket, data) => {

  let predictionDoc, userAddress

  // setup signature data
  const msgParams = [
    {
      name: 'Your vote',
      type: 'string',
      value: data.descriptionString
    },
    {
      name: 'Question ID',
      type: 'string',
      value: data.questionId
    }
  ]

  // recover the address that signed the signature
  userAddress = sigUtil.recoverTypedSignature({
    data: msgParams,
    sig: data.signature
  })

  GameSchema.findById(data.gameId)
    .populate({
      path: 'currentQuestion',
      model: 'Question',
      select: '_id question options answers'
    })
    .then(gameDoc => {
      if(!gameDoc){throw {error: 'no game'}}

      // validate account against whitelist
      if(!userAddress || !playerOnList(userAddress, gameDoc.playerList)){
        throw {error: 'bad user'}
      }

      // test
      gameDoc.currentQuestion.answers.push({
        gameId: data.gameId,
        questionId: data.questionId,
        userAddress: userAddress,
        signature: data.signature,
        answerIndex: data.answerIndex,
        descriptionString: data.descriptionString
      })

      // save prediction
      return gameDoc.save()
    })
    .then(updatedGame => {
      return Game.userData(userAddress)
    })
    .then(updatedGame => {
      return Promise.resolve(game.emit('update', updatedGame))
    })
    .catch(error => {
      console.log(error)
      return Promise.resolve(game.emit('error', error))
    })


}
