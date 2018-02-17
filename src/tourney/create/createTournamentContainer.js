import { connect } from 'react-redux'
import CreateForm from './CreateForm'
import { createTournament } from '../TourneyActions'

const mapStateToProps = (state, ownProps) => {
  return {
    transactionPending: state.web3.transactionPending,
    transactionError: state.web3.transactionError,
    transactionID: state.web3.transactionID
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    createTournament: (options) => {
      dispatch(createTournament(options))
    }
  }
}

const CreateContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(CreateForm)

export default CreateContainer
