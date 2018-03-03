import React from 'react'
import SelectTable from './selectTable'

class AddProposal extends React.Component {
  constructor(props){
    super(props)

    this.state = {
      proposalTarget: {},
      proposalAction: ''
    }
  }

  selectItem(index, action){
    this.setState({
      proposalTarget: this.props.candidateList[index],
      proposalAction: action
    })
  }

  submitProposal(target, action){

    this.props.submitProposal(target, action)

    this.setState({
      proposalTarget: {},
      proposalAction: ''
    })

  }

  render () {
    return(

      <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>

        <div style={{flex: 1}}>
          <h2>Submit a proposal</h2>
        </div>

        <div style={{flex: 5, display: 'flex', flexDirection: 'row'}}>

          <div style={{flex: 2}}>
            <h3>Add</h3>
            <div style={{overflowY: 'scroll', height: '80%'}}>
              <SelectTable
                items={this.props.candidateList}
                selectRow={this.selectItem.bind(this)}
                selectedItem={this.state.proposalTarget}
                action="add"/>
            </div>
          </div>

          <div style={{flex: 2}}>
            <h3>Remove</h3>
            <div style={{overflowY: 'scroll', height: '80%'}}>
              <SelectTable
                items={this.props.itemList}
                selectRow={this.selectItem.bind(this)}
                selectedItem={this.state.proposalTarget}
                action="remove"/>
            </div>
          </div>

        </div>

        <div style={{flex: 2, display: 'flex', flexDirection: 'row'}}>

          <div style={{flex: 1}}>
            <h3>Confirm</h3>
            <p>Proposal: {this.state.proposalAction} {this.state.proposalTarget.name}</p>
            <button
              className="pure-button pure-button-primary"
              disabled={!this.state.proposalTarget || !this.state.proposalAction}
              onClick={()=>{this.submitProposal(this.state.proposalTarget,this.state.proposalAction)}}>Submit</button>
            <button
              className="pure-button"
              onClick={()=>{this.submitProposal({symbol: ''}, 'pass')}}>Pass</button>
          </div>

        </div>
      </div>

  )}
}

export default AddProposal
