import React from 'react'
import SelectTable from './selectTable'

class voteOnProposal extends React.Component {
  constructor(props){
    super(props)

    this.state = {
      voteTarget: {},
      vote: ''
    }
  }

  selectItem(item, action){
    this.setState({
      voteTarget: item,
      proposalAction: action
    })
  }

  toggleVote(event){
    this.setState({vote: event.target.name})
  }

  answerYes(vote){
    this.setState({selectedVote: 1})
  }
  answerNo(vote){
    this.setState({selectedVote: 0})
  }
  setVoteStyle(button){
    if(button === this.state.selectedVote){
      return {background: '#103A52'}
    }

    // default
    return {}
}

  render(){
      return(
        <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>

          <div style={{flex: 1}}>
            <h2>Vote on Proposals</h2>
          </div>

          <div style={{flex: 7, display: 'flex', flexDirection: 'row'}}>

              <div style={{flex: 2}}>

                <h3> Proposal </h3>
                <SelectTable
                  items={this.props.proposalList}
                  selectRow={this.selectItem.bind(this)}
                  selectedItem={this.state.voteTarget}
                  action=""/>

              </div>
              <div style={{flex: 2, display: 'flex', flexDirection: 'column'}}>

                <div style={{flex: 6}}>
                  <h3> Vote </h3>
                  <div>
                    <p> {} {this.state.voteTarget.name}? </p>
                  </div>
                </div>

                <div style={{display: 'flex', justifyContent: 'space-evenly'}}>
                  <div>
                    <button
                      className="pure-button pure-button-primary"
                      style={this.setVoteStyle(1)}
                      onClick={this.answerYes.bind(this)}> Yes {this.state.selectedVote === 1 ? '✔' : ''}
                    </button>
                  </div>
                  <div>
                    <button
                      className="pure-button pure-button-primary"
                      style={this.setVoteStyle(0)}
                      onClick={this.answerNo.bind(this)}> No {this.state.selectedVote === 0  ? '✔' : ''}
                    </button>
                  </div>
                </div>

                <div style={{flex: 1, textAlign: 'center'}}>
                  <button
                    className="pure-button pure-button-primary"
                    onClick={() => {this.props.submitVote(this.state.voteTarget, this.state.selectedVote)}}> Submit </button>
                </div>

              </div>

          </div>
        </div>
      )

  }

}

export default voteOnProposal
