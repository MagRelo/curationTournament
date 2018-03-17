import React from 'react'

function ImageButton(props){
  const {name, imgUrl, index, submitVote, selected} = props

  const row = index < 2 ? "1" : "2"
  const column = index%2 === 0 ? "1" : "2"

  return <div
      style={{
        gridRow: row,
        gridColumn: column,
        backgroundImage: 'url(' + imgUrl + ')',
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        border: (selected ? 'solid orange 10px' : '')
      }}
      onClick={()=> submitVote(name, index)}>

      <div style={{
          background: 'linear-gradient( to bottom, black, rgba(255, 0, 0, 0) )',
          paddingBottom: '0.5em',
          paddingLeft: '0.25em',
          fontSize: '2em'}}>

          {name}
      </div>
    </div>
}

class questionPanel extends React.Component {
  constructor(props){
    super(props)
  }

  render(){
      return (
        <div style={{gridRow: '2 / 4', gridColumn:'2 / 4', display: 'grid', gridGap: '1em'}}>

          {this.props.options.map((option, index) => {

            return <ImageButton
              key={this.props.options[index]._id}
              name={this.props.options[index].name}
              imgUrl={this.props.options[index].imgUrl}
              selected={this.props.options[index].selected}
              index={index}
              submitVote={this.props.submitVote.bind(this)}/>
          })}

        </div>
      )
  }

}

export default questionPanel
