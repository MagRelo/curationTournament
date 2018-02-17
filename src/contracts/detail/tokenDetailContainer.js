import { connect } from 'react-redux'
import tokenDetailComponent from './tokenDetailComponent'
import { buyTokens, sellTokens, burnTokens, drainEscrow, sendAnalytics, getContract} from '../ContractActions'

const mapStateToProps = (state, ownProps) => {
  return {
    web3: state.web3,
    contract: state.contracts.contract || {},
    contractLoading: state.contracts.contractLoading,
    transactionPending: state.contracts.transactionPending,
    transactionError: state.contracts.transactionError,
    transactionID: state.contracts.transactionID,
    calcPurchasePrice: state.contracts.calcPurchasePrice
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    sendAnalytics: (eventType, eventData) => {
      dispatch(sendAnalytics(eventType, eventData))
    },
    getContract: (contractAddress) => {
      dispatch(getContract(contractAddress))
    },
    buyTokens: (contractAddress, payment) => {
      dispatch(buyTokens(contractAddress, payment))
    },
    sellTokens: (contractAddress, tokensToSell) => {
      dispatch(sellTokens(contractAddress, tokensToSell))
    },
    burnTokens: (contractAddress, targetAddress, tokensToBurn ) => {
      dispatch(burnTokens(contractAddress, targetAddress, tokensToBurn ))
    },
    drainEscrow: (contractAddress, amount) => {
      dispatch(drainEscrow(contractAddress, amount))
    }

  }
}

const tokenDetailContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(tokenDetailComponent)

export default tokenDetailContainer
