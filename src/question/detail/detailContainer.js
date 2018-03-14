import { connect } from 'react-redux'
import tokenDetailComponent from './detailComponent'

const mapStateToProps = (state, ownProps) => {
  return {
    web3: state.web3,
    userAddress: state.web3.account
  }
}

const mapDispatchToProps = (dispatch) => {
  return {}
}

const tourneyContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(tokenDetailComponent)

export default tourneyContainer
