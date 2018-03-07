import React from 'react'

const addProposal = (props) => {
  const {proposalList} = props

  function descriptionString(item){
    return (item.action === 'add' ? 'Add' : ' Remove') + ' ' + item.target.name
  }

  return(
    <div className="game-panel">

      <h3>Proposals</h3>
      <div style={{flex: '7'}}>
        <table className="pure-table pure-table-horizontal table-100">
          <thead>
            <tr>
              <td>Proposal</td>
              <td>Consensus</td>
              <td>Agreement</td>
              <td>Outcome</td>
              <td>Proposal Payout</td>
            </tr>
          </thead>
          <tbody>
            {proposalList.map(item =>{
              return <tr key={item._id}>
                  <td>{descriptionString(item)}</td>
                  <td>{item.outcome}</td>
                  <td>{item.agreement}</td>
                  <td>Pass</td>
                  <td>100</td>
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
              <td>Consensus</td>
              <td>Voting Payout</td>
            </tr>
          </thead>
          <tbody>
            {proposalList.map(item =>{
              return <tr key={item._id}>
                  <td>{descriptionString(item)}</td>
                  <td>{item.vote ? 'in favor' : 'against'}</td>
                  <td>in favor</td>
                  <td>10</td>
              </tr>
            })}
          </tbody>
        </table>
      </div>

    </div>
  )

}

export default addProposal
