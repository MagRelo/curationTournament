import React from 'react'

const addProposal = (props) => {
  const {proposalList, votesList} = props

  function descriptionString(item){
    return (item.action === 'add' ? 'Add' : ' Remove') + ' ' + item.target.name
  }

  function displayAsPercentage(ratio){
    return (ratio * 100) + '%'
  }

  return(
    <div className="game-panel">

      <h3>Proposals</h3>
      <div style={{flex: '7'}}>
        <table className="pure-table pure-table-horizontal table-100">
          <thead>
            <tr>
              <td>Proposal</td>
              <td>Agreement</td>
              <td>Outcome</td>
              <td>Proposal Payout</td>
            </tr>
          </thead>
          <tbody>
            {proposalList.map(item =>{
              return <tr key={item._id}>
                  <td>{descriptionString(item)}</td>
                  <td>{displayAsPercentage(item.agreement)}</td>
                  <td>{item.outcome ? 'Pass' : 'Fail'}</td>
                  <td>{item.outcome ? '100' : '0'}</td>
              </tr>
            })}
          </tbody>
        </table>
      </div>

      <h3>Your Votes</h3>
      <div style={{flex: '7'}}>
        <table className="pure-table pure-table-horizontal table-100">
          <thead>
            <tr>
              <td>Proposal</td>
              <td>Your Vote</td>
              <td>Agreement</td>
              <td>Voting Payout</td>
            </tr>
          </thead>
          <tbody>
            {proposalList.map(item =>{
              return <tr key={item._id}>
                  <td>{descriptionString(item)}</td>
                  <td>{item.userVote ? 'group will agree' : 'group will disagree'}</td>
                  <td>{displayAsPercentage(item.agreement)}</td>
                  <td>{item.userPayout}</td>
              </tr>
            })}
          </tbody>
        </table>
      </div>

    </div>
  )

}

export default addProposal
