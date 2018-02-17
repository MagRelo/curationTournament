const initialState = {
  config: null,
  transactionMessage: '',
  transactionPending: false,
  transactionError: null,
  transactionID: '',
  list: [],
  contractLoading: true,
  contract: {},
  calcTokenPrice: calcTokenPrice,
  calcPurchasePrice: calcPurchasePrice
}

const contractReducer = (state = initialState, action) => {

  if (action.type === 'REQUEST_SENT')
  {
    return Object.assign({}, state, {
      transactionPending: true,
      transactionResult: null
    })
  }

  if (action.type === 'REQUEST_ERROR'){
    return Object.assign({}, state, {
      transactionPending: false,
      transactionError: true,
      transactionMessage: action.payload.message
    })
  }
  if (action.type === 'CONTRACT_CREATED'){
    return Object.assign({}, state, {
      transactionPending: false,
      transactionError: false,
      contractAddress: action.payload.deployedAddress,
      contractOptions: action.payload.contractOptions,
    })
  }
  if (action.type === 'TRANSACTION_SUCCESS'){
    return Object.assign({}, state, {
      transactionPending: false,
      transactionError: false,
      transactionID: action.payload.tx
    })
  }

  if (action.type === 'LIST_UPDATE')
  {
    return Object.assign({}, state, {
      contract: null,
      contractLoading: true,
      list: action.payload
    })
  }
  if (action.type === 'CONFIG_UPDATE')
  {
    return Object.assign({}, state, {
      config: action.payload
    })
  }
  if (action.type === 'CONTRACT_UPDATE')
  {
    return Object.assign({}, state, {
      contractLoading: false,
      contract: action.payload
    })
  }
  if (action.type === 'CONTRACT_LOADING')
  {
    return Object.assign({}, state, {
      contractLoading: true,
    })
  }

  return state
}

function calcPurchasePrice(tokensToPurchase, maxTokens, tokenSupply, tokenBasePrice, linearDivisor, exponentDivisor){

  function fracExp(k,q,n,p){
    let s = 0;
    let N = 1;
    let B = 1;
    for (let i = 0; i < p; ++i){
      s += k * N / B / (q**i);
      N  = N * (n-i);
      B  = B * (i+1);
    }
    return s;
  }

  tokensToPurchase = tokensToPurchase || 0
  tokensToPurchase = Math.min(tokensToPurchase, maxTokens)

  if(linearDivisor === 1){
    return tokenBasePrice * tokensToPurchase
  }

  let totalPurchasePrice = 0
  let linear = 0
  let exp = 0
  let nextTokenPrice = 0
  for(let i=1; i <= tokensToPurchase; i++){
    linear = tokenBasePrice * (tokenSupply + i)/linearDivisor
    exp = fracExp(tokenBasePrice, exponentDivisor, tokenSupply, 2)
    nextTokenPrice = exp + linear

    totalPurchasePrice += nextTokenPrice
  }

  return totalPurchasePrice
}

function calcTokenPrice(tokenNumber, tokenBasePrice, linearDivisor, exponentDivisor){

  function fracExp(k,q,n,p){
    let s = 0;
    let N = 1;
    let B = 1;
    for (let i = 0; i < p; ++i){
      s += k * N / B / (q**i);
      N  = N * (n-i);
      B  = B * (i+1);
    }
    return s;
  }

  if(linearDivisor === 1){
    return tokenBasePrice
  }

  let linear = tokenBasePrice * tokenNumber/linearDivisor
  let exp = fracExp(tokenBasePrice, exponentDivisor, tokenNumber, 2)
  let nextTokenPrice = exp + linear

  return nextTokenPrice
}

export default contractReducer
