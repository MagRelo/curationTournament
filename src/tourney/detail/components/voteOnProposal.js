import React from 'react'
import SelectTable from './selectTable'

class voteOnProposal extends React.Component {
  constructor(props){
    super(props)

    this.state = {
      selectedProposal: {
        target: {}
      },
      vote: '',
      selectedVote: null,
    }
  }

  selectItem(index){
    this.setState({
      proposalIndex: index,
      selectedProposal: this.props.proposalList[index]
    })
  }

  submitVote(target, action){

    this.props.submitVote(this.state.selectedProposal, this.state.selectedVote)

    this.setState({
      selectedProposal: {
        target: {}
      },
      selectedVote: null,
      vote: ''
    })

  }

  answerYes(vote){ this.setState({selectedVote: 1}) }
  answerNo(vote){ this.setState({selectedVote: 0}) }
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

                <h3> Pending Proposals </h3>
                <SelectTable
                  items={this.props.proposalList.map(proposal => {return proposal.target})}
                  selectRow={this.selectItem.bind(this)}
                  selectedItem={this.state.selectedProposal.target}
                  action=""/>

              </div>
              <div style={{flex: 2, display: 'flex', flexDirection: 'column'}}>

                <div style={{flex: 6}}>
                  <h3> Vote on proposal</h3>
                  {this.state.selectedProposal.target.symbol ?

                    <div>
                      <p> Proposal: {this.state.selectedProposal.action} {this.state.selectedProposal.target.name} </p>
                    </div>

                  :null}
                </div>

                <div style={{display: 'flex', justifyContent: 'space-evenly'}}>
                  <div>
                    <button
                      className="pure-button pure-button-primary"
                      style={this.setVoteStyle(1)}
                      onClick={this.answerYes.bind(this)}> Agree {this.state.selectedVote === 1 ? '✔' : ''}
                    </button>
                  </div>
                  <div>
                    <button
                      className="pure-button pure-button-primary"
                      style={this.setVoteStyle(0)}
                      onClick={this.answerNo.bind(this)}> Disagree {this.state.selectedVote === 0  ? '✔' : ''}
                    </button>
                  </div>
                </div>

                <div style={{flex: 1, textAlign: 'center'}}>
                  <button
                    className="pure-button pure-button-primary"
                    disabled={!this.state.selectedProposal || this.state.selectedVote === null}
                    onClick={() => {this.submitVote(this.state.selectedProposal, this.state.selectedVote)}}> Submit </button>
                </div>

              </div>

          </div>
        </div>
      )

  }

}

export default voteOnProposal
