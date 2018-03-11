import React from 'react'
import {Line} from 'react-progressbar.js'

const roundProgress = (props) => {
  const {config, status} = props

  // progress bar options
  const options = { strokeWidth: 0.5, color: '#ffffff' }
  const containerStyle = { width: '100%', height: '10px' }

  function displayText(status){

    let text = 'Round ' + (status.currentRound + 1) + ': ' + status.gameState

    if(status.gameState === 'ready'){
      text = 'Ready'
    }

    if(status.gameState === 'closed'){
      text = 'Game complete'
    }

    return text
  }

  return(
    <div className="game-panel">

      <h2>{displayText(status)}</h2>

        {(status.gameState === 'proposals' ||
          status.gameState === 'voting' ||
          status.gameState === 'results')  &&  config.timedGame ?

          <div>
            <div className="progressbar" style={{transform: 'rotateY(180deg)'}}>
              <Line
                progress={Math.max(status.timeRemaining/config.lengthOfPhase, 0)}
                initialAnimate={false}
                options={options}
                containerStyle={containerStyle}
                containerClassName={'.progressbar'}/>
            </div>

            <div style={{textAlign: 'right'}}>

              {status.timeRemaining > 0 ?
                <label>Time remaining: {status.timeRemaining}</label>
              :
                <div>
                  <label style={{float: 'right',  marginRight: '1.67em'}}>Loading...</label>
                  <div className="small-spinner"></div>
                </div>
              }

            </div>

          </div>
        :null}

    </div>
  )

}

export default roundProgress
