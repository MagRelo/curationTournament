import React from 'react'

const roundProgress = (props) => {
  const {roundList, timeRemaining} = props

  return(
    <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>

      <div style={{flex: '1'}}>
        <h2>Rounds</h2>
        <time>{timeRemaining}</time>
      </div>
      <div style={{flex: 5}}>

        <ul>
          {roundList.map(round =>{
            return <li colSpan="2" key={round.index}> Round {round.roundNumber}
              <ul>
                <li key={round.index + 'a'}>Proposals {round.proposalsClosed ? '✔' : '' }</li>
                <li key={round.index + 'b'}>Voting {round.votesClosed ? '✔' : '' }</li>
              </ul>

            </li>
          })}
        </ul>


      </div>

    </div>

  )

}

export default roundProgress
