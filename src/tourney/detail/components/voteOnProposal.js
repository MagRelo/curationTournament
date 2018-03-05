import React from 'react'

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

    this.props.submitVote(target, action)

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

  descriptionString(item){
    return '\"' + item.action
    + ' ' + item.target.name
    + (item.action === 'add' ? ' to' : ' from'  )
    + ' list\"'
  }

  activeClass(item, vote){

    let defaultStyle = 'pure-button'

    if(item.userVoted && item.vote == vote){
      defaultStyle += ' pure-button-active'
    }

    return defaultStyle
  }

  hasVoted(userAddress, itemId){
    return
  }

  render(){
      return(

          <div className="game-panel" style={{flex: 7}}>
            <h3> Vote on pending proposals: </h3>

            <ul style={{padding: 0}}>
              {this.props.proposalList.map(item => {
                return <li style={{listItem: 'none'}} key={item._id}>

                  <div className="game-panel">

                    <button className={this.activeClass(item, 0)}
                      style={{float: 'right'}}
                      onClick={() => {this.submitVote(item, 0)}}>against</button>

                    <button className={this.activeClass(item, 1)}
                      style={{float: 'right'}}
                      onClick={() => {this.submitVote(item, 1)}}>in favor</button>


                    Proposal: {this.descriptionString(item)}

                  </div>

                </li>
              })}
            </ul>

          </div>
      )

  }

}

export default voteOnProposal
