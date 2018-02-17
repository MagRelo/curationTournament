import React from 'react'

const addProposal = (props) => {
  const {resultsList} = props

  return(
    <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>

      <div style={{flex: '1'}}>
        <h2>Results</h2>
      </div>

      <div style={{flex: '7'}}>
        <table className="pure-table pure-table-horizontal table-100">
          <thead>
            <tr>
              <td>Proposal</td>
              <td>Your Vote</td>
              <td>Results</td>
              <td>Proposal Payout</td>
              <td>Voting Payout</td>
            </tr>
          </thead>
          <tbody>

            {resultsList.map( item =>{
              return <tr key={item.symbol}>
                  <td>{item.name}</td>
                  <td>yes</td>
                  <td>9 / 1</td>
                  <td>0</td>
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
