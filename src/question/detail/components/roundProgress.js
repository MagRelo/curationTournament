import React from 'react'
import {Line} from 'react-progressbar.js'

const roundProgress = (props) => {
  const {question, lengthOfPhase, timeRemaining} = props

  // progress bar options
  const options = { strokeWidth: 0.5, color: '#ffffff' }
  const containerStyle = { width: '100%', height: '6px' }

  return(
    <div>

      <h2>{question}</h2>


        <div>
          <div className="progressbar" style={{transform: 'rotateY(180deg)'}}>
            <Line
              progress={Math.max(timeRemaining/lengthOfPhase, 0)}
              initialAnimate={false}
              options={options}
              containerStyle={containerStyle}
              containerClassName={'.progressbar'}/>
          </div>

          <div style={{textAlign: 'right'}}>

            {status.timeRemaining > 0 ?
              <label style={{textTransform: 'uppercase', fontSize: 'smaller'}}>
                Time remaining: {timeRemaining}
              </label>
            :
              <div>
                <label style={{float: 'right',  marginRight: '1.67em'}}>Loading...</label>
                <div className="small-spinner"></div>
              </div>
            }

          </div>

        </div>

    </div>
  )

}

export default roundProgress
