import { connect } from 'react-redux'
import CreateForm from './CreateForm'
import { createContract, getConfig} from '../ContractActions'

const mapStateToProps = (state, ownProps) => {
  return {
    transactionPending: state.contracts.transactionPending,
    transactionError: state.contracts.transactionError,
    transactionID: state.contracts.transactionID,
    calcTokenPrice: state.contracts.calcTokenPrice
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    createContract: (options) => {
      dispatch(createContract(options))
    },
    loadConfig: ()=>{
      dispatch(getConfig())
    }
  }
}

const CreateContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(CreateForm)

export default CreateContainer
