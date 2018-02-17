const initialState = {
  user: {},
  list: [],
  status: {},
  timeRemaining: 0,
  rounds: [],
  items: [],
  playerList: [],
  candidateList: [],
  proposalList: []
}

const tournamentReducer = (state = initialState, action) => {

  if (action.type === 'CONTRACT_CREATED'){
    return Object.assign({}, state, {
      contract: action.payload
    })
  }
  if (action.type === 'UPDATE_USER'){
    console.log('UPDATE_USER');
    return Object.assign({}, state, {
      user: action.payload
    })
  }
  if (action.type === 'UPDATE_LIST'){
    console.log('UPDATE_LIST');
    return Object.assign({}, state, {
      list: action.payload
    })
  }

  return state
}

export default tournamentReducer


function filterCandidates(baseArray, removeArray){
  const idArray = removeArray.map(item => item.symbol)
  return baseArray.filter(baseItem => !~idArray.indexOf(baseItem.symbol))
}
