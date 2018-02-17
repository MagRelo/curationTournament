import { connect } from 'react-redux'
import tourneyListComponent from './listComponent'
import {listTournaments} from '../TourneyActions'

const mapStateToProps = (state, ownProps) => {
  return {
    list: state.tournament.list,
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    loadList: ()=>{
      dispatch(listTournaments())
    },
    loadConfig: ()=>{
      dispatch(getConfig())
    }
  }
}

const listContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(tourneyListComponent)

export default listContainer
