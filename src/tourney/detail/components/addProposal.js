import React from 'react'
// import SelectTable from './selectTable'
// import {Typeahead} from 'react-typeahead'


class AddProposal extends React.Component {
  constructor(props){
    super(props)
  }

  render () {
    return(

        <div style={{display: 'flex', flexDirection: 'row'}}>

          <div className="game-panel white-bg"  style={{flex: 3}}>
            <h3>Remove an item</h3>
            <small>Risk 10 to win 100</small>

          <ul style={{padding: 0}}>

              {this.props.itemList.map(item => {
                return <li style={{listItem: 'none', marginBottom: '0.5em'}} key={item.symbol}>
                  <button className="pure-button"
                    style={{float: 'right'}}
                    onClick={()=>{this.props.submitProposal(item,'remove')}}>remove</button>
                  <div style={{padding: '.5em 1em .5em 0'}}>
                    {item.name} ({item.symbol})
                  </div>
                </li>
              })}

            </ul>
          </div>

          <div style={{flex: 3}}>

            <div className="game-panel white-bg" style={{flex: 4}}>
              <h3>Add an item</h3>
              <small>Risk 10 to win 50</small>

              <ul style={{padding: 0}}>
                {this.props.candidateList.map(item => {
                  return <li style={{listItem: 'none', marginBottom: '0.5em'}} key={item.symbol}>

                    <button className="pure-button"
                      style={{float: 'right'}}
                      onClick={() => {this.props.submitProposal(item, 'add')}}>add
                    </button>

                    <div style={{padding: '.5em 1em .5em 0'}}>
                      {item.name} ({item.symbol})
                    </div>

                  </li>
                })}
              </ul>
            </div>

          </div>
          <div style={{flex: 3}}>

            <div className="game-panel white-bg" style={{flex: 1}}>
              <h3>Pass</h3>
              <small>No cost</small>
              <div style={{marginTop: '1.5em'}}>
                <button
                  style={{float: 'right'}}
                  className="pure-button"
                  onClick={()=>{this.props.submitProposal({symbol: ''}, 'pass')}}>Pass
                </button>
              </div>
            </div>

          </div>

        </div>

  )}
}

export default AddProposal
