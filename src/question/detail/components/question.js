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

  descriptionString(item){
    return (item.action === 'add' ? 'Add' : ' Remove') + ' ' + item.target.name
  }

  activeClass(item, vote){

    let defaultStyle = 'pure-button'

    if(item.userVoted && item.userVote == vote){
      defaultStyle += ' pure-button-active'
    }

    return defaultStyle
  }

  render(){
      return(

        <div style={{display: 'flex', flexDirection: 'column'}}>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gridGap: '1em'}}>
            <div style={{gridRow: '1', gridColumn:'1', backgroudColor: 'gray'}}></div>
            <div style={{gridRow: '1', gridColumn:'2', backgroudColor: 'orange'}}></div>
            <div style={{gridRow: '2', gridColumn:'1', backgroudColor: 'pink'}}></div>
            <div style={{gridRow: '2', gridColumn:'2', backgroudColor: 'yellow'}}></div>
          </div>
        </div>

      )

  }

}

export default voteOnProposal
