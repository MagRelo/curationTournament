import React, { Component } from 'react'
import Cookies from 'js-cookie'


class SignInComponent extends Component {
  constructor(props) {
    super(props)
    this.state = {
      ready: false
    }
  }

  componentDidMount(){

    // wait for web3 to be injected
    let intId = 0
    if(this.props.web3.web3Instance){
      this.setState({ready: true})
    } else {
      intId = setInterval(watchForWeb3.bind(this), 500)
    }
    function watchForWeb3(){
      if(this.props.web3.web3Instance){
        console.log('web3 ready!');
        this.setState({ready: true})
        clearInterval(intId);
      } else {
        console.log('watching for web3...')
      }
    }

    this.props.getUser(this.props.tournamentId)
  }

  login(){
    this.props.login(this.props.tournamentId)
  }

  render() {
    return(

      <div style={{textAlign: 'right'}}>

        {this.props.user.userAddress ?
          <p>User: {this.props.user.userAddress}</p>
          :
          <button
            onClick={this.login.bind(this)}
            disabled={!this.state.ready}
            className="pure-button pure-button-primary">
            Login
          </button>
        }

      </div>
    )
  }
}


export default SignInComponent
