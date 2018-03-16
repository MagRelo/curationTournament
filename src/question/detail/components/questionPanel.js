import React from 'react'

function ImageButton(props){
  const {name, imgUrl, row, column, submitVote, selected} = props
  let styleObject = {
      gridRow: row,
      gridColumn: column,
      backgroundImage: 'url(' + imgUrl + ')',
      backgroundPosition: 'center',
      backgroundSize: 'cover'
    }

  if(selected){
    styleObject.border = 'solid orange 10px'
  }

  return <div
      style={styleObject}
      onClick={()=> submitVote(name)}>

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

          <ImageButton
            name={this.props.options[0].name}
            imgUrl={this.props.options[0].imgUrl}
            selected={this.props.options[0].selected}
            row="1"
            column="1"
            submitVote={this.props.submitVote.bind(this)}/>

          <ImageButton
            name={this.props.options[1].name}
            imgUrl={this.props.options[1].imgUrl}
            selected={this.props.options[1].selected}
            row="1"
            column="2"
            submitVote={this.props.submitVote.bind(this)}/>

          <ImageButton
            name={this.props.options[2].name}
            imgUrl={this.props.options[2].imgUrl}
            selected={this.props.options[2].selected}
            row="2"
            column="1"
            submitVote={this.props.submitVote.bind(this)}/>

          <ImageButton
            name={this.props.options[3].name}
            imgUrl={this.props.options[3].imgUrl}
            selected={this.props.options[3].selected}
            row="2"
            column="2"
            submitVote={this.props.submitVote.bind(this)}/>

        </div>
      )
  }

}

export default questionPanel
