import React from 'react'

const addProposal = (props) => {
  const {roundList} = props

  return(
    <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>

      <div style={{flex: '1'}}>
        <h2>Rounds</h2>
      </div>

      <div style={{flex: 5}}>
        <table className="pure-table pure-table-horizontal table-100">
          <thead>
            <tr>
              {roundList.map(round =>{
                return <td colSpan="2" key={round.meta.index}> Round {round.meta.roundNumber}</td>
              })}
            </tr>
            <tr>
              {roundList.map(round =>{
                return [<td>proposals</td>, <td>voting</td>]
              })}
            </tr>
          </thead>
          <tbody>
            <tr>
              {roundList.map(round =>{
                return [
                  <td key={round.meta.index + 'a'}>{round.meta.proposalsClosed ? '✔' : '' }</td>,
                  <td key={round.meta.index + 'b'}>{round.meta.votesClosed ? '✔' : '' }</td>
                ]
              })}
            </tr>
          </tbody>
        </table>
      </div>

    </div>

  )

}

export default addProposal
