
import { browserHistory } from 'react-router'
import Cookies from 'js-cookie'

import store from '../store'
import {sendEvent} from '../analytics/AnalyticsActions'


export const UPDATE_USER = 'UPDATE_USER'
function updateUser(user) {
  return {
    type: UPDATE_USER,
    payload: user
  }
}
export const UPDATE_LIST = 'UPDATE_LIST'
function updateList(list) {
  return {
    type: UPDATE_LIST,
    payload: list
  }
}
export const CONTRACT_CREATED = 'CONTRACT_CREATED'
function contractCreated(contract) {
  return {
    type: CONTRACT_CREATED,
    payload: contract
  }
}

export function createTournament(rounds){
  return function(dispatch){

    return fetch('/api/game',{
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        rounds: 3
      })
    })
    .then(rawResponse => {
      if(rawResponse.status !== 200){ throw new Error(rawResponse.text) }
      return rawResponse.json()
    })
    .then(results => {
      console.log('party!');
      // dispatch(configUpdated(results))
    })
    .catch(error => {
      console.error('action error', error)
    })

  }
}
export function listTournaments(){
  return function(dispatch){

    return fetch('/api/list')
    .then(rawResponse => {
      if(rawResponse.status !== 200){ throw new Error(rawResponse.text) }
      return rawResponse.json()
    })
    .then(results => {
      dispatch(updateList(results))
    })
    .catch(error => {
      console.error('action error', error)
    })

  }
}

export function getUser(gameId){
  return function(dispatch){

    let cookie
    const cookieString = Cookies.get('servesa')
    if(cookieString){
      try {
        cookie = JSON.parse(cookieString)
      } catch (e) {
        console.log(e);
      }
    }

    // check if it's for the current game
    if(cookie && cookie.gameId === gameId){
      dispatch(updateUser(cookie))
    } else {
      dispatch(updateUser({}))
    }

  }
}

export function login(gameId) {
  let web3 = store.getState().web3.web3Instance
  let userAddress = web3.eth.accounts[0]

  return function(dispatch) {

    const msgParams = [{
      name: 'Message',
      type: 'string',
      value: 'You will be logged into game ' + gameId
    }]

    web3.currentProvider.sendAsync({
        method: 'eth_signTypedData',
        params: [msgParams, userAddress],
        from: userAddress,
      }, function (err, result) {
        if (err) return console.error(err)
        if (result.error) {
          return console.error(result.error.message)
        }

        const user = {
          gameId: gameId.toString(),
          userAddress: userAddress,
          signature: result.result
        }

        // set session cookie, wait for update :)
        console.log(user);
        Cookies.set('servesa', user);
        dispatch(updateUser(user))
      })

  }
}
