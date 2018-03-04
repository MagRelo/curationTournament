import React from 'react'
import {Line} from 'react-progressbar.js'

const roundProgress = (props) => {
  const {roundList, timeRemainingRatio, caption} = props

  var options = {
       strokeWidth: 2,
       color: '#ffffff',
       style: {
           // Text color.
           // Default: same as stroke color (options.color)
           color: '#ffffff',
           position: 'absolute',
           left: '50%',
           top: '50%',
           padding: 0,
           margin: 0,
           // You can specify styles which will be browser prefixed
           transform: {
               prefix: true,
               value: 'translate(-50%, -50%)'
           }
       },
     };
  var containerStyle = {
     width: '100%',
     height: '40px'
  };

  return(
    <div className="progressbar">
      <Line
        progress={timeRemainingRatio}
        text={caption}
        options={options}
        initialAnimate={false}
        containerStyle={containerStyle}
        containerClassName={'.progressbar'} />
    </div>

  )

}

export default roundProgress
