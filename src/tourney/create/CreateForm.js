import React, { Component } from 'react'
import { Link } from 'react-router'

import ethereum_address from 'ethereum-address'


// import WrappedModal from '../confirmationModal'

class CreateContractForm extends Component {
  constructor(props) {
    super(props)

    this.state = {
      contractOwner: '',
      oracleAddress: '',
      tournamentName: '',
      playerWhitelist: [
        "0x863afa452F38966b54Cb1149D934e34670D0683a",
        "0x106F681949E222D57A175cD85685E3bD9975b973",
        "0xdf396910e693f7De31eF88d0090F2A4333ffcCF3"
      ],
      newPlayer: '',
      rounds: 5,
      minDeposit: 0.1,
      exchangeRate: 1

    }
  }
  componentDidMount(){
    fetch("https://api.coinmarketcap.com/v1/ticker/ethereum/?convert=USD")
    .then(res => {return res.json()})
    .then(data => {
      this.setState({
        exchangeRate: parseInt(data[0].price_usd, 10)
      });
    });
  }

  // Form functions
  handleChange(event) {
    event.preventDefault()
    this.setState({[event.target.name]: event.target.value})
  }

  handleSubmit(event) {
    event.preventDefault()
    this.props.createTournament({
      contractOwner: this.props.userAddress,
      oracleAddress: 'asdnfaosdifnasdoif',
      name: this.state.tournamentName,
      minDeposit: this.state.minDeposit,
      rounds: this.state.rounds,
      playerList: this.state.playerWhitelist
    })
  }

  addPlayer(){
    const tempArray = this.state.playerWhitelist
    tempArray.push(this.state.newPlayer)

    this.setState({
      newPlayer: '',
      playerWhitelist: tempArray
    })
  }
  removePlayer(index){
    let tempArray = this.state.playerWhitelist
    tempArray.splice(index, 1)
    this.setState({
      playerWhitelist: tempArray
    })
  }

  validPlayerAddress(address){
    return ethereum_address.isAddress(address)
  }
  round(value, places){
    places = places || 4
    return +(Math.round(value + "e+" + places)  + "e-" + places);
  }
  formatEth(ether){
     return 'Ξ' + this.round(ether, 5) + ' ETH ($' +
      this.round(this.state.exchangeRate * ether) + ')'
  }
  render() {
    return(

      <div>
        <h2>Create new tournament</h2>

        <form className="pure-form" onSubmit={this.handleSubmit.bind(this)}>
          <fieldset>

            <label>tournament Name</label>
            <input
              className="pure-input-1"
              type="text"
              name="tournamentName"
              value={this.state.tournamentName}
              onChange={this.handleChange.bind(this)}></input>

            <label>Number of rounds</label>
            <input
              className="pure-input-1"
              type="number"
              name="rounds"
              min="0"
              step="1"
              value={this.state.rounds}
              onChange={this.handleChange.bind(this)}></input>


          </fieldset>

        <h3>Potential List Items</h3>
        <fieldset>
          <label className="pure-radio">
            <input type="radio" checked={this.state.itemRadio}></input>Top 20 list from coincenter.io
          </label>
        </fieldset>


        <h3>Buy-in</h3>
        <p>Each player will have to deposit this amount to participate.</p>
        <fieldset>
          <label>Player Buy-in: {this.formatEth(this.state.minDeposit)}</label>
          <input
            className="pure-input-1"
            type="number"
            name="minDeposit"
            min="0.01"
            step="any"
            value={this.state.minDeposit}
            onChange={this.handleChange.bind(this)}>
          </input>
        </fieldset>



        <h3>Add Players</h3>
        <p>Add each player's address. Only whitelisted players will be able to deposit and participate.</p>

        <ul style={{padding: 0}}>
          {this.state.playerWhitelist.map((item, index) => {
            return <li style={{listStyle: 'none', marginBottom: '0.5em'}} key={index}>

              <div className="game-panel white-bg">

                <button className="pure-button"
                  style={{float: 'right'}}
                  type="button"
                  onClick={this.removePlayer.bind(this, index)}>remove
                </button>
                <div style={{padding: '.5em 1em .5em 0'}}>
                  {item}
                </div>

              </div>

            </li>
          })}
        </ul>

        <div>
          <input
            className="pure-input-1-2"
            type="text"
            name="newPlayer"
            value={this.state.newPlayer}
            onChange={this.handleChange.bind(this)}>
          </input>

          <button
            className="pure-button"
            style={{marginBottom: '16px'}}
            type="button"
            disabled={!this.validPlayerAddress(this.state.newPlayer)}
            onClick={this.addPlayer.bind(this)}> Add Player
          </button>
        </div>

        <hr></hr>

        <button
          type="submit"
          className="pure-button pure-button-xlarge pure-button-primary"
          onClick={this.handleSubmit.bind(this)}> + Create tournament
        </button>

      </form>

    </div>


    )
  }
}

export default CreateContractForm
