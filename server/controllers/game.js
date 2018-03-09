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

  newGame.rounds = buildRounds(options.rounds)
  newGame.playerList = buildPlayerList(options.playerList)

  // TODO testing
  newGame.status.gameReady = true
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

exports.handlePropsal = (game, socket, data) => {

  let gameDoc, userAddress

  GameSchema.findById(data.gameId)
    .then(gameModel => {
      if(!gameModel){throw {error: 'no game'}}

      gameDoc = gameModel

      // setup signature data
      const descriptionString = '\"' + data.action
        + ' ' + data.target.name
        + (data.action === 'add' ? ' to' : ' from'  )
        + ' list\"'
      const msgParams = [
        {
          name: 'Proposal',
          type: 'string',
          value: descriptionString
        },
        {
          name: 'Round',
          type: 'uint',
          value: data.round
        },
        {
          name: 'Game ID',
          type: 'string',
          value: data.gameId
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
      if(gameDoc.rounds[gameDoc.status.currentRound].proposalsClosed){
        throw {error: 'wrong round/proposals closed'}
      }

      return PredictionModel.addProposal(userAddress, data)
    })
    .then(proposalDoc => {

      // add prediction to game
      if(!~gameDoc.predictions.indexOf(proposalDoc._id)){
        gameDoc.predictions.push(proposalDoc._id)
      }

      // save game
      return gameDoc.save()
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


function buildPlayerList(playerList){

  let list = []

  // build rounds
  for(let i=0; i < playerList.length; i++){
    list.push({
      userAddress: playerList[i],
      chips: 100
    })
  }

  return list
}
function buildRounds(roundsCount){

  let rounds = []

  // build rounds
  for(let i=0; i < roundsCount; i++){
    rounds.push({
      index: i,
      roundNumber: i + 1,
      proposalsClosed: false,
      votesClosed: false
    })
  }

  return rounds
}
function playerOnList(userAddress, playerList){
  return playerList.some(player => {
    return player.userAddress.toLowerCase() === userAddress.toLowerCase()
  })
}
const candidateList = [
    {
        "id": "bitcoin",
        "name": "Bitcoin",
        "symbol": "BTC",
        "rank": "1",
        "price_usd": "11810.2",
        "price_btc": "1.0",
        "24h_volume_usd": "8936710000.0",
        "market_cap_usd": "199310411475",
        "available_supply": "16876125.0",
        "total_supply": "16876125.0",
        "max_supply": "21000000.0",
        "percent_change_1h": "0.8",
        "percent_change_24h": "6.02",
        "percent_change_7d": "36.65",
        "last_updated": "1519148068"
    },
    {
        "id": "ethereum",
        "name": "Ethereum",
        "symbol": "ETH",
        "rank": "2",
        "price_usd": "943.957",
        "price_btc": "0.0809465",
        "24h_volume_usd": "2328350000.0",
        "market_cap_usd": "92258521882.0",
        "available_supply": "97735937.0",
        "total_supply": "97735937.0",
        "max_supply": null,
        "percent_change_1h": "-0.35",
        "percent_change_24h": "-0.58",
        "percent_change_7d": "11.57",
        "last_updated": "1519148051"
    },
    {
        "id": "ripple",
        "name": "Ripple",
        "symbol": "XRP",
        "rank": "3",
        "price_usd": "1.13512",
        "price_btc": "0.00009734",
        "24h_volume_usd": "674144000.0",
        "market_cap_usd": "44280141082.0",
        "available_supply": "39009215838.0",
        "total_supply": "99992725510.0",
        "max_supply": "100000000000",
        "percent_change_1h": "-0.22",
        "percent_change_24h": "-0.9",
        "percent_change_7d": "10.36",
        "last_updated": "1519148041"
    },
    {
        "id": "bitcoin-cash",
        "name": "Bitcoin Cash",
        "symbol": "BCH",
        "rank": "4",
        "price_usd": "1521.46",
        "price_btc": "0.130469",
        "24h_volume_usd": "741531000.0",
        "market_cap_usd": "25831309844.0",
        "available_supply": "16977975.0",
        "total_supply": "16977975.0",
        "max_supply": "21000000.0",
        "percent_change_1h": "-0.21",
        "percent_change_24h": "-0.74",
        "percent_change_7d": "22.79",
        "last_updated": "1519148052"
    },
    {
        "id": "litecoin",
        "name": "Litecoin",
        "symbol": "LTC",
        "rank": "5",
        "price_usd": "245.893",
        "price_btc": "0.0210859",
        "24h_volume_usd": "1557920000.0",
        "market_cap_usd": "13598770120.0",
        "available_supply": "55303608.0",
        "total_supply": "55303608.0",
        "max_supply": "84000000.0",
        "percent_change_1h": "-1.02",
        "percent_change_24h": "9.29",
        "percent_change_7d": "55.45",
        "last_updated": "1519148041"
    },
    {
        "id": "cardano",
        "name": "Cardano",
        "symbol": "ADA",
        "rank": "6",
        "price_usd": "0.38998",
        "price_btc": "0.00003344",
        "24h_volume_usd": "258667000.0",
        "market_cap_usd": "10111038968.0",
        "available_supply": "25927070538.0",
        "total_supply": "31112483745.0",
        "max_supply": "45000000000.0",
        "percent_change_1h": "-0.15",
        "percent_change_24h": "-0.52",
        "percent_change_7d": "5.12",
        "last_updated": "1519148054"
    },
    {
        "id": "neo",
        "name": "NEO",
        "symbol": "NEO",
        "rank": "7",
        "price_usd": "137.323",
        "price_btc": "0.0117757",
        "24h_volume_usd": "208266000.0",
        "market_cap_usd": "8925995000.0",
        "available_supply": "65000000.0",
        "total_supply": "100000000.0",
        "max_supply": null,
        "percent_change_1h": "-0.75",
        "percent_change_24h": "0.75",
        "percent_change_7d": "23.19",
        "last_updated": "1519148049"
    },
    {
        "id": "stellar",
        "name": "Stellar",
        "symbol": "XLM",
        "rank": "8",
        "price_usd": "0.425419",
        "price_btc": "0.00003648",
        "24h_volume_usd": "86546900.0",
        "market_cap_usd": "7856547831.0",
        "available_supply": "18467787830.0",
        "total_supply": "103708899665",
        "max_supply": null,
        "percent_change_1h": "-1.1",
        "percent_change_24h": "-6.44",
        "percent_change_7d": "4.1",
        "last_updated": "1519148043"
    },
    {
        "id": "eos",
        "name": "EOS",
        "symbol": "EOS",
        "rank": "9",
        "price_usd": "9.75284",
        "price_btc": "0.00083633",
        "24h_volume_usd": "282285000.0",
        "market_cap_usd": "6641679234.0",
        "available_supply": "680999507.0",
        "total_supply": "900000000.0",
        "max_supply": "1000000000.0",
        "percent_change_1h": "-0.02",
        "percent_change_24h": "0.62",
        "percent_change_7d": "8.04",
        "last_updated": "1519148051"
    },
    {
        "id": "dash",
        "name": "Dash",
        "symbol": "DASH",
        "rank": "10",
        "price_usd": "737.303",
        "price_btc": "0.0632255",
        "24h_volume_usd": "107400000.0",
        "market_cap_usd": "5821642811.0",
        "available_supply": "7895862.0",
        "total_supply": "7895862.0",
        "max_supply": "18900000.0",
        "percent_change_1h": "0.55",
        "percent_change_24h": "1.67",
        "percent_change_7d": "22.87",
        "last_updated": "1519148041"
    }
]
