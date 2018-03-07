import React from 'react'
// import SelectTable from './selectTable'
// import {Typeahead} from 'react-typeahead'


class AddProposal extends React.Component {
  constructor(props){
    super(props)
  }

  activeClass(itemId){

    const userProposal = this.props.userData.proposal ? this.props.userData.proposal.target.symbol : ''

    let defaultStyle = 'pure-button'

    if(itemId === userProposal){
      defaultStyle += ' pure-button-active'
    }

    return defaultStyle
  }


  render () {
    return(

        <div className="game-panel" style={{display: 'flex', flexDirection: 'row'}}>

          <div style={{flex: 3}}>
            <h3>Remove an item</h3>
            <small>Risk 10 to win 100</small>

            <ul style={{padding: 0}}>

              {this.props.itemList.map(item => {
                return <li style={{listStyle: 'none'}} key={item.symbol}>

                  <div className="game-panel white-bg">

                    <button className={this.activeClass(item.symbol, '')}
                      style={{float: 'right'}}
                      onClick={()=>{this.props.submitProposal(item,'remove')}}>remove</button>

                    <div style={{margin: '8px'}}>
                      {item.name} ({item.symbol})
                    </div>

                  </div>

                </li>
              })}

            </ul>
          </div>

          <div style={{flex: 3}}>

            <h3>Add an item</h3>
            <small>Risk 10 to win 50</small>

            <ul style={{padding: 0}}>
              {this.props.candidateList.map(item => {
                return <li style={{listStyle: 'none'}} key={item.symbol}>

                  <div className="game-panel white-bg">

                    <button className={this.activeClass(item.symbol, '')}
                      style={{float: 'right'}}
                      onClick={() => {this.props.submitProposal(item, 'add')}}>add
                    </button>

                    <div style={{margin: '8px'}}>
                      {item.name} ({item.symbol})
                    </div>
                  </div>

                </li>
              })}
            </ul>

          </div>
          <div style={{flex: 3}}>

            <h3>Pass</h3>
            <small>No cost</small>


            <ul style={{padding: 0}}>
              <li style={{listStyle: 'none'}}>

                <div className="game-panel white-bg">

                  <button className="pure-button"
                    style={{float: 'right'}}
                    onClick={() => {this.props.submitProposal({symbol: 'pass'}, 'pass')}}>Pass
                  </button>

                  <div style={{margin: '8px'}}>
                    {'Pass'}
                  </div>
                </div>

              </li>
            </ul>

          </div>

        </div>

  )}
}

export default AddProposal
