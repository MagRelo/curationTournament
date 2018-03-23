const initialState = {
  user: {},
  list: []
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
