const initialState = {
  web3Instance: null,
  account: ''
}

const web3Reducer = (state = initialState, action) => {
  if (action.type === 'WEB3_INITIALIZED')
  {
    return Object.assign({}, state, {
      web3Instance: action.payload.web3Instance,
      account: action.payload.web3Instance.eth.accounts[0]
    })
  }

  return state
}

export default web3Reducer
