import React from 'react'

function round(value, places){
  places = places || 4
  return Number((Math.round(value + "e" + places)  + "e-" + places));
}

function tokenShare(chipCount, players){
  let chipTotal = players.reduce((count, player) => { return count + player.chips }, 0)
  return round(100 * (chipCount / chipTotal), 2) + '%'
}

const playerList = (props) => {
  const {playerList, currentAccount} = props

  return(
    <div className="game-panel bg-white">

      <h3>Players ({playerList.length})</h3>
      <div>
        <table className="pure-table pure-table-horizontal table-100">
          <thead>
            <tr>
              <td>Address</td>
              <td>Points</td>
            </tr>
          </thead>
          <tbody>

            {playerList.map( player =>{
              return <tr key={player.userAddress}
                style={{color: player.userAddress.toLowerCase() === currentAccount.toLowerCase() ? 'orange': ''}}>
                  <td>{player.userAddress.substring(0, 10)}</td>
                  <td>{player.chips}</td>
              </tr>
            })}

          </tbody>
        </table>
      </div>

    </div>
  )

}

export default playerList
