import React from 'react'
import {Line} from 'react-progressbar.js'

const roundProgress = (props) => {
  const {roundList, timeRemaining, timeRemainingRatio, status} = props

  var options = { strokeWidth: 0.5, color: '#ffffff' };
  var containerStyle = { width: '100%', height: '10px' };

  return(
    <div className="game-panel">

      <h2>{'Round ' + (status.currentRound + 1) + ': ' + status.currentPhase}</h2>

      <div className="progressbar" style={{transform: 'rotateY(180deg)'}}>
        <Line
          progress={timeRemainingRatio}
          options={options}
          initialAnimate={false}
          containerStyle={containerStyle}
          containerClassName={'.progressbar'} />
      </div>

      <div style={{textAlign: 'right'}}>
        Time remaining: {timeRemaining}
      </div>

    </div>
  )

}

export default roundProgress
