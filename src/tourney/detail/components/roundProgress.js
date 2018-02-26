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
            return <li colSpan="2" key={round.meta.index}> Round {round.meta.roundNumber}
              <ul>
                <li key={round.meta.index + 'a'}>Proposals {round.meta.proposalsClosed ? '✔' : '' }</li>
                <li key={round.meta.index + 'b'}>Voting {round.meta.votesClosed ? '✔' : '' }</li>
              </ul>

            </li>
          })}
        </ul>


      </div>

    </div>

  )

}

export default roundProgress
