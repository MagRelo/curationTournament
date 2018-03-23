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
        <h1>Servesa</h1>
        <p>Scalable web architecture for web3</p>

        <h2>Features</h2>
        <ul>
          <li>Privacy</li>
          <li>Secure user accounts with no email or passwords</li>
          <li>Transparent accounting for user's funds</li>
        </ul>

      </main>
    )
  }
}

export default TournamentList
