import { combineReducers } from 'redux'
import { routerReducer } from 'react-router-redux'

import web3Reducer from './util/web3/web3Reducer'

import tourneyReducer from './tourney/TourneyReducer'

const reducer = combineReducers({
  routing: routerReducer,
  tournament: tourneyReducer,
  web3: web3Reducer
})

export default reducer
