import { connect } from 'react-redux'
import accountComponent from './accountComponent'

const mapStateToProps = (state, ownProps) => {
  return {
    web3: state.web3,
    userAddress: state.web3.account
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
  }
}

const accountContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(accountComponent)

export default accountContainer
