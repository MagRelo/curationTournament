import React from 'react'

function round(value, places){
  places = places || 4
  return +(Math.round(value + "e+" + places)  + "e-" + places);
}

function tokenShare(chipCount, players){
  let chipTotal = players.reduce((count, player) => { return count + player.chips }, 0)
  return round(100 * (chipCount / chipTotal), 2) + '%'
}

const playerList = (props) => {
  const {playerList, currentAccount} = props

  return(
    <div>

      <h3>Players ({playerList.length})</h3>
      <div style={{marginLeft: '1em'}}>
        <table className="pure-table pure-table-horizontal table-100">
          <thead>
            <tr>
              <td>Name</td>
              <td>Share</td>
            </tr>
          </thead>
          <tbody>

            {playerList.map( player =>{
              return <tr key={player.userAddress}
                style={{color: player.userAddress.toLowerCase() === currentAccount.toLowerCase() ? 'orange': ''}}>
                  <td>{player.userAddress.substring(0, 12)}...</td>
                  <td>{tokenShare(player.chips, playerList)}</td>
              </tr>
            })}

          </tbody>
        </table>
      </div>

    </div>
  )

}

export default playerList
