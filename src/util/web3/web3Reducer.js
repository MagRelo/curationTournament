const initialState = {
  web3Instance: null,
  accounts: []
}

const web3Reducer = (state = initialState, action) => {
  if (action.type === 'WEB3_INITIALIZED')
  {
    return Object.assign({}, state, {
      web3Instance: action.payload.web3Instance,
      accounts: action.payload.web3Instance.eth.accounts
    })
  }

  return state
}

export default web3Reducer
