import { connect } from 'react-redux'
import CreateForm from './CreateForm'
import { createTournament } from '../TourneyActions'

const mapStateToProps = (state, ownProps) => {
  return {
    web3: state.web3,
    userAddress: state.web3.account
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
