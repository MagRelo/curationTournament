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


  // lifecycle
  componentDidMount(){

    // wait for web3 to be injected
    let intId = 0
    if(this.props.web3.web3Instance){

      console.log('web3 ready');

      this.setState({ready: true})

    } else {
      intId = setInterval(watchForWeb3.bind(this), 500)
    }

    function watchForWeb3(){
      if(this.props.web3.web3Instance){

        console.log('web3 found');

        this.setState({ready: true})

        // clear timer
        clearInterval(intId);
      } else {
        console.log('watching for web3...')
      }
    }

  }

  render() {
    return(
      <main>
        <h1>Account</h1>

        <h3>Browser status</h3>
        <p>To participate you need to use a web browser that supports Web3</p>
        <p>Requirements:</p>
        <ul>
          <li>Does your browser support Web3? {!!this.props.web3 ? 'Yes' : 'No'}</li>
          <li>Is your Ethereum account available? {!!this.props.userAddress ? 'Yes' : 'No'}</li>
        </ul>

        <h3>Account status</h3>
        <p>Your account: {this.props.userAddress}</p>
        <ul>
          <li>Is your account on the whitelist? No
            <p><Link to="/pasta">Request Access</Link></p>
          </li>
          <li>Have you deposited in the contract? No
            <p><Link to="/party">Send Deposit</Link></p>
          </li>
        </ul>

        <Link
          className="pure-button pure-button-xlarge pure-button-primary"
          to="/live"> Join Game
        </Link>

      </main>
    )
  }
}

export default TournamentList
