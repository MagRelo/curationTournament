import {sendEvent} from '../analytics/AnalyticsActions'
import { browserHistory } from 'react-router'
import bluebird from 'bluebird'

const contract = require('truffle-contract')

import ServesaContract from '../../build/contracts/Servesa.json'
import ServesaFactory from '../../build/contracts/ServesaFactory.json'
import store from '../store'

export const CONFIG_UPDATE = 'CONFIG_UPDATE'
function configUpdated(config) {
  return {
    type: CONFIG_UPDATE,
    payload: config
  }
}

export const LIST_UPDATE = 'LIST_UPDATE'
function listUpdated(list) {
  return {
    type: LIST_UPDATE,
    payload: list
  }
}

export const CONTRACT_LOADING = 'CONTRACT_LOADING'
function contractLoading() {
  return {
    type: CONTRACT_LOADING
  }
}

export const CONTRACT_UPDATE = 'CONTRACT_UPDATE'
function contractUpdated(contract) {
  return {
    type: CONTRACT_UPDATE,
    payload: contract
  }
}


// Web 3 handoff UX
export const REQUEST_SENT = 'REQUEST_SENT'
function requestSent() {
  return {
    type: REQUEST_SENT
  }
}
export const CONTRACT_CREATED = 'CONTRACT_CREATED'
function contractCreated(result) {
  return {
    type: CONTRACT_CREATED,
    payload: result
  }
}
export const TRANSACTION_SUCCESS = 'TRANSACTION_SUCCESS'
function transactionSuccess(result) {
  return {
    type: TRANSACTION_SUCCESS,
    payload: result
  }
}
export const REQUEST_ERROR = 'REQUEST_ERROR'
function requestError(result) {
  return {
    type: REQUEST_ERROR,
    payload: result
  }
}



export function sendAnalytics(eventType, eventData) {
  return function(dispatch) {
    dispatch(sendEvent(eventType, eventData))
  }
}
export function getConfig(term) {
  return function(dispatch) {

    return fetch('/api/config')
      .then(rawResponse => {
        if(rawResponse.status !== 200){ throw new Error(rawResponse.text) }
        return rawResponse.json()
      })
      .then(results => {
        dispatch(configUpdated(results))
      })
      .catch(error => {
      console.error('action error', error)
      return
    })

  }
}
export function searchContracts(term) {
  return function(dispatch) {

    // "loading"
    dispatch(requestSent())

    dispatch(sendEvent('search', { term: term }))

    return fetch('/api/contract/search',
      {
        method: "POST",
        body: { term: term }
      }
    ).then(rawResponse => {
        if(rawResponse.status !== 200){ throw new Error(rawResponse.text) }
        return rawResponse.json()
      }
    ).then(searchResults => {
        dispatch(listUpdated(searchResults))
      }
    ).catch(error => {
      console.error('action error', error)
      return
    })

  }
}

export function getContract(contractAddress) {
  let web3 = store.getState().web3.web3Instance
  let userAddress = web3.eth.accounts[0]

  // map contract getter functions to "this.props" fieldnames for convenience on the other side...
  const getterMap = [
    {getter: 'getContractBalance', state: 'balance'},
    {getter: 'getOwner', state: 'owner'},
    {getter: 'totalCurrentTokens', state: 'tokens'},
    {getter: 'totalCurrentFunders', state: 'funders'},
    {getter: 'maxTokens', state: 'maxTokens'},
    {getter: 'ownerCanBurn', state: 'ownerCanBurn'},
    {getter: 'ownerCanSpend', state: 'ownerCanSpend'},
    {getter: 'tokenPriceLinearDivisor', state: 'tokenPriceLinearDivisor'},
    {getter: 'tokenPriceExponentDivisor', state: 'tokenPriceExponentDivisor'},
    {getter: 'tokenBasePrice', state: 'tokenBasePrice'},
    {getter: 'contractName', state: 'contractName'},
    {getter: 'contractAvatarUrl', state: 'contractAvatarUrl'},
    {getter: 'calculateNextBuyPrice', state: 'buyPrice'},
    {getter: 'calculateNextSellPrice', state: 'sellPrice'}
  ]

  let updateObject = {}

  return function(dispatch) {

    // "loading"
    dispatch(contractLoading())

    const groupContract = contract({abi: ServesaContract.abi})
    groupContract.defaults({from: userAddress})
    groupContract.setProvider(web3.currentProvider)
    groupContract.at(contractAddress)
      .then(instance => {

        // create array of getter promises
        let promiseArray = []
        getterMap.map(item => {
          promiseArray.push(instance[item.getter]())
        })

        if(userAddress){
          promiseArray.push(instance.getFunderTokens(userAddress))
          promiseArray.push(instance.getFunderPurchase(userAddress))
        }

        // execute all getters at once
        return bluebird.all(promiseArray)
      })
      .then(resultArray => {

        if(userAddress){
          // pop off the last two
          updateObject.activeAccountPurchase = resultArray.splice(-1,1)[0]
          updateObject.activeAccountTokens = resultArray.splice(-1,1)[0]
        }

        // unpack results array into object using getterMap from before
        resultArray.forEach((result, index) => {
          updateObject[getterMap[index].state] = result
        })

        // check owner
        updateObject.activeAccountIsOwner = (userAddress === updateObject.owner)

        dispatch(contractUpdated(updateObject))
      })
      .catch(error => {
        console.log(error)
      })
  }
}

export function createContract(contractOptions) {
  let web3 = store.getState().web3.web3Instance
  let userAddress = web3.eth.accounts[0]
  let config = store.getState().contracts.config

  let web3Result = null

  return function(dispatch) {

    // "loading" display
    dispatch(requestSent())

    // send analytics
    dispatch(sendEvent('create', { 'contractOptions': contractOptions } ))

    if(web3 && userAddress){

      // legacy setting from staketree
      let sunsetWithdrawPeriod = 10000

      const factoryContract = contract({abi: ServesaFactory.abi})
      factoryContract.setProvider(web3.currentProvider)
      factoryContract.defaults({from: userAddress})
      factoryContract.at(config.deployedFactoryAddress)
        .then(instance => {

          // Create contract on Ethereum
          return instance.newContract(
            userAddress,
            contractOptions.contractName,
            contractOptions.contractAvatarUrl,
            contractOptions.ownerCanBurn,
            contractOptions.ownerCanSpend,
            contractOptions.maxTokens,
            web3.toWei(contractOptions.tokenBasePrice, 'ether'),
            contractOptions.tokenPriceExponentDivisor,
            contractOptions.tokenPriceLinearDivisor,
            sunsetWithdrawPeriod)

        }).then(result => {

          web3Result = result

          // Create contract on Servesa search
          console.log('Contract Address:', result.receipt.logs[0].address)

          return fetch('/api/contract/create',{
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              deployedAddress: result.receipt.logs[0].address,
              deployedNetwork: "Testing?",
              contractOptions: contractOptions
            })
          })

        }).then(rawResponse => {
          if(rawResponse.status !== 200){ throw new Error(rawResponse.text) }
          return rawResponse.json()
        })
        .then(result => {
          result.inError = false

          // return web3 reponse, not Servesa server response
          console.log(web3Result)
          dispatch(contractCreated(web3Result))
        })
        .catch(error => {
          console.log(error)
          dispatch(requestError(error))
        })

    }

  }
}

export function buyTokens(contractAddress, payment) {
  let web3 = store.getState().web3.web3Instance
  let userAddress = web3.eth.accounts[0]

  return function(dispatch) {

    // "loading"
    dispatch(requestSent())
    // analytics
    dispatch(sendEvent('buy', {'payment': payment}))

    const groupContract = contract({abi: ServesaContract.abi})
    groupContract.defaults({from: userAddress})
    groupContract.setProvider(web3.currentProvider)
    groupContract.at(contractAddress)
      .then(instance => {
        return instance.buy({value: payment})
      })
      .then(result => {
        console.log(result)
        dispatch(transactionSuccess(result))
      })
      .catch(error => {
        console.log(error)
        dispatch(requestError(error))
      })

  }
}

export function sellTokens(contractAddress, tokensToSell) {
  let web3 = store.getState().web3.web3Instance
  let userAddress = web3.eth.accounts[0]

  return function(dispatch) {

    // "loading"
    dispatch(requestSent())
    // analytics
    dispatch(sendEvent('sell', {'tokensToSell': tokensToSell}))

    const groupContract = contract({abi: ServesaContract.abi})
    groupContract.defaults({from: userAddress})
    groupContract.setProvider(web3.currentProvider)
    groupContract.at(contractAddress)
      .then(instance => {
        return instance.sell(parseInt(tokensToSell, 10))
      })
      .then(result => {
        console.log(result)
        dispatch(transactionSuccess(result))
      })
      .catch(error => {
        console.log(error)
        dispatch(requestError(error))
      })

  }
}

export function burnTokens(contractAddress, targetAddress, tokensToBurn ) {
  let web3 = store.getState().web3.web3Instance
  let userAddress = web3.eth.accounts[0]

  return function(dispatch) {

    // "loading"
    dispatch(requestSent())
    // analytics
    dispatch(sendEvent('burn', {'targetAddress': targetAddress, 'tokensToBurn': tokensToBurn}))

    const groupContract = contract({abi: ServesaContract.abi})
    groupContract.defaults({from: userAddress})
    groupContract.setProvider(web3.currentProvider)
    groupContract.at(contractAddress)
      .then(instance => {
        return instance.burn(targetAddress, parseInt(tokensToBurn, 10))
      })
      .then(result => {
        console.log(result)
        dispatch(transactionSuccess(result))
      })
      .catch(error => {
        console.log(error)
        dispatch(requestError(error))
      })


  }
}

export function drainEscrow(contractAddress, amount) {
  let web3 = store.getState().web3.web3Instance
  let userAddress = web3.eth.accounts[0]

  return function(dispatch) {

    // "loading"
    dispatch(requestSent())
    // analytics
    dispatch(sendEvent('drain', { 'amount': amount}))

    const groupContract = contract({abi: ServesaContract.abi})
    groupContract.defaults({from: userAddress})
    groupContract.setProvider(web3.currentProvider)
    groupContract.at(contractAddress)
      .then(instance => {

        return instance.sell(parseInt(amount, 10))
      })
      .then(result => {
        console.log(result)
        dispatch(transactionSuccess(result))
      })
      .catch(error => {
        console.log(error)
        dispatch(requestError(error))
      })

  }
}
