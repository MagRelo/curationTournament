import React from 'react'
import {Line} from 'react-progressbar.js'


// progress bar options
const options = { strokeWidth: 5, color: '#ffffff' }
const containerStyle = { width: '100%', height: '6px' }


function round(value, places){
  places = places || 4
  return Number((Math.round(value + "e" + places)  + "e-" + places));
}
function displayPercent(value){
  return round(value * 100, 1) + '%'
}


function ImageButton(props){
  const {name, imgUrl, selected, row, column, submitVote} = props

  const votePercentage = Math.random()

  return <div style={{
              display: 'grid',
              gridGap: '1em',
              gridTemplateColumns: '1fr 3fr 1fr',
              gridTemplateRows: 'auto'}}>

      <div style={{
            backgroundImage: 'url(' + imgUrl + ')',
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            border: (selected ? 'solid orange 10px' : '')}}>

        <div style={{
            background: 'linear-gradient( to bottom, black, rgba(255, 0, 0, 0) )',
            paddingBottom: '0.5em',
            paddingLeft: '0.25em',
            fontSize: '2em'}}>
            <span>{name}</span>
        </div>
      </div>

      <div style={{
            display: 'grid',
            gridGap: '1em',
            gridTemplateColumns: 'auto',
            gridTemplateRows: '1fr 1fr 1fr'}}>

            <div className="progressbar">
              <Line
                progress={votePercentage}
                initialAnimate={false}
                options={options}
                containerStyle={containerStyle}
                containerClassName={'.progressbar'}/>
            </div>
            <span>{displayPercent(votePercentage)}</span>
      </div>

      <div>win?</div>

    </div>
}

class resultsPanel extends React.Component {
  constructor(props){
    super(props)
  }

  render(){
      return (
        <div style={{
            gridRow: '2 / 4',
            gridColumn:'2 / 4',
            display: 'grid',
            gridGap: '1em',
            gridTemplateColumns: '1fr',
            gridTemplateRows: '1fr 1fr 1fr 1fr'
          }}>

          {this.props.options.map(option => {

            return <ImageButton
                    key={option.name}
                    name={option.name}
                    imgUrl={option.imgUrl}
                    selected={option.selected}/>

          })}

        </div>
      )
  }

}

export default resultsPanel
