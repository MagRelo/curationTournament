import { connect } from 'react-redux'
import signinComponent from './signinComponent'
import { getUser, login } from '../TourneyActions'

const mapStateToProps = (state, ownProps) => {
  return {
    web3: state.web3,
    user: state.tournament.user
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    login: (gameId) => {
      dispatch(login(gameId))
    },
    getUser: (gameId) => {
      dispatch(getUser(gameId))
    }
  }
}

const SignInContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(signinComponent)

export default SignInContainer
