import React, { Component } from 'react'
import { Link } from 'react-router'
// import {Tokenizer}  from 'react-typeahead';

class TournamentList extends Component {
  constructor(props, { authData }) {
    super(props)
    authData = this.props
    this.state = {
    }
  }

  componentDidMount(){

  }

  render() {
    return(
      <main>
        <h1>Can Sense Us</h1>
        <p>A simple consensus game.</p>

        <h2>Game Status:</h2>
        <p>Status: Active!</p>
        <p>Current Players: 123</p>

        <h2>Your status:</h2>
        <p>Web3 avilable? {!!this.props.web3 ? 'Yes' : 'No'}</p>
        <p>Ethereum account available? {!!this.props.userAddress ? 'Yes' : 'No'}</p>

        <Link
          className="pure-button pure-button-xlarge pure-button-primary"
          to="/live"> Join Game
        </Link>

      </main>
    )
  }
}

export default TournamentList
