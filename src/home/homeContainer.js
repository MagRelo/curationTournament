import { connect } from 'react-redux'
import tourneyListComponent from './homeComponent'

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

const listContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(tourneyListComponent)

export default listContainer
