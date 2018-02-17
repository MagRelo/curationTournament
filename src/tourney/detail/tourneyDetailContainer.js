import { connect } from 'react-redux'
import tokenDetailComponent from './tourneyDetailComponent'

const mapStateToProps = (state, ownProps) => {
  return {}
}

const mapDispatchToProps = (dispatch) => {
  return {}
}

const tourneyContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(tokenDetailComponent)

export default tourneyContainer
