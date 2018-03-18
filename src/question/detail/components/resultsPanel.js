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


function ResultsPanelItem(props){
  const {name, imgUrl, agreement, outcome, selected, row, column, submitVote} = props

  return <div style={{
              display: 'grid',
              gridGap: '1em',
              gridTemplateColumns: '2fr 3fr 1fr',
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
            gridTemplateColumns: 'auto',
            gridTemplateRows: '1fr 1fr 1fr'}}>

            <div className="progressbar" style={{gridRow: '2'}}>
              <Line
                progress={agreement}
                initialAnimate={false}
                options={options}
                containerStyle={containerStyle}
                containerClassName={'.progressbar'}/>
              <p>{displayPercent(agreement)}</p>
            </div>

      </div>

      <div>{outcome ? 'win!': ''}</div>

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
            gridTemplateColumns: '1fr',
            gridTemplateRows: '1fr 1fr 1fr 1fr'
          }}>

          {this.props.options.map(option => {

            return <ResultsPanelItem
                    key={option.name}
                    name={option.name}
                    imgUrl={option.imgUrl}
                    selected={option.selected}
                    outcome={option.outcome}
                    agreement={option.agreement}/>

          })}

        </div>
      )
  }

}

export default resultsPanel
