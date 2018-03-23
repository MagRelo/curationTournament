const fetch = require('request-promise')
const moment = require('moment')
const sigUtil = require('eth-sig-util')

const config = require('../config/environment')

const GameSchema = require('../models/game')
const Game = require('mongoose').model('Game')

const QuestionSchema = require('../models/question')
const Question = require('mongoose').model('Question')

const AnswerSchema = require('../models/answer')


exports.createGame = (req, res) => {
  const newGame = new GameSchema({})

  // validate input
  const options = req.body

  // setup with game
  newGame.contractNetwork = ''
  newGame.contractAddress = ''

  // from contract, eventually
  newGame.ownerAddress = '0x106f681949e222d57a175cd85685e3bd9975b973'
  newGame.oracleAddress = '0x106f681949e222d57a175cd85685e3bd9975b973'
  newGame.minDeposit = 0.1
  newGame.contributors = ['5aad40d6ec802afd31b96bf2', '5aad40ecec802afd31b96bf3']

  newGame.save()
    .then(gameDoc => { res.json(gameDoc) })
    .catch(error => {
      console.log(error)
      res.status(500).json({error: error})
    })

}
exports.nextPhase = (req, res) => {

  Game.nextPhase()
    .then(gameDoc => {
      return Game.userData('')
    })
    .then(gameData => {
      res.io.of('game').emit('update', gameData)
      return res.json(gameData)
    })
    .catch(error => {
      console.log(error)
      res.status(500).json({error: error.message})
    })

}
exports.createQuestion = (req, res) => {

  const question = new QuestionSchema({
    question: 'What is best cat?',
    options: [
      {name: 'jimmy', imgUrl: 'https://d17fnq9dkz9hgj.cloudfront.net/uploads/2012/11/144334862-giving-cat-bath-632x475.jpg'},
      {name: 'pete', imgUrl: 'https://d17fnq9dkz9hgj.cloudfront.net/uploads/2012/11/155310872-is-cat-stray-632x475.jpg'},
      {name: 'richard', imgUrl: 'https://d17fnq9dkz9hgj.cloudfront.net/uploads/2013/09/cat-black-superstitious-fcs-cat-myths-162286659.jpg'},
      {name: 'baxter', imgUrl: 'https://www.royalcanin.com/~/media/Royal-Canin/Product-Categories/cat-adult-landing-hero.ashx'},
    ]
  })

  question.save()
    .then(gameDoc => { res.json(gameDoc) })
    .catch(error => { res.status(500).json({error: error}) })

}


//
// CLIENT GAME DATA
//
exports.requestData = (auth, data) => {

  // if socket has auth => userData
  if(auth){
    return Game.userData(auth.userAddress)
  }

  // no auth => public data
  return Game.userData('')
}
exports.handleVote = (auth, data) => {

  const gameId = data.gameId
  const questionId = data.questionId
  let userAddress = null

  // setup signature data
  const msgParams = [
    {
      name: 'Question',
      type: 'string',
      value: data.questionString
    },
    {
      name: 'Your vote',
      type: 'string',
      value: data.answer
    }
  ]

  // recover the address that signed the signature
  userAddress = sigUtil.recoverTypedSignature({
    data: msgParams,
    sig: data.signature
  })

  if(!gameId || !questionId || !userAddress){
    console.log('bad vote data');
    return Promise.reject('bad vote data')
  }

  return GameSchema.findById(data.gameId)
    .populate({ path: 'contributors', model: 'User', select: 'userAddress' })
    .then(gameDoc => {
      if(!gameDoc){throw {error: 'no game'}}

      // validate account against whitelist
      if(!userAddress || !playerOnList(userAddress, gameDoc.contributors)){
        throw {error: 'bad user'}
      }

      // upsert answer
      return AnswerSchema.addAnswer(userAddress, {
        gameId: data.gameId,
        questionId: data.questionId,
        userAddress: userAddress,
        signature: data.signature,
        answerIndex: data.answerIndex,
        questionString: data.questionString
      })

    })
    .then(answerDoc => {
      console.log('answer added:', !!answerDoc._id, answerDoc._id);

      // add answerId to question doc
      return Question.update({_id: questionId}, {'$addToSet': {answers: answerDoc._id}})
    })
    .then(questionDoc => {

      // get fresh data
      return Game.userData(userAddress)
    })

}


//
// ON-CHAIN CONTRACT DATA
//
exports.updateGameData = (update) => {

  const {action, data} = update

  // add contributors
    // userAddress, +value
  // remove contributors
    // userAddress, -value

}

function playerOnList(userAddress, playerList){
  return playerList.some(player => {
    return player.userAddress.toLowerCase() === userAddress.toLowerCase()
  })
}
