import { connect } from 'react-redux'
import contractListComponent from './contractListComponent'
import {searchContracts, getConfig} from '../ContractActions'

const mapStateToProps = (state, ownProps) => {
  return {
    list: state.contracts.list,
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    loadList: ()=>{
      dispatch(searchContracts())
    },
    loadConfig: ()=>{
      dispatch(getConfig())
    }
  }
}

const contractListContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(contractListComponent)

export default contractListContainer
