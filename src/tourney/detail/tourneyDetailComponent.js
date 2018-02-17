import React, { Component } from 'react'
import { Link } from 'react-router'

// sockets
import io from 'socket.io-client';
let gameSocket

// timer
let intervalId = 0

import LoginButton from '../signin/signinContainer'
import WrappedModal from '../confirmationModal'

//
import AddProposal from './components/addProposal'
import VoteOnProposal from './components/voteOnProposal'
import RoundResults from './components/roundResults'
import RoundProgress from './components/roundProgress'
import PlayerList from './components/playerList'
import SelectTable from './components/selectTable'


class FormComponent extends Component {
  constructor(props) {
    super(props)

    // connect to game
    gameSocket = io('http://localhost:8080/game');

    // gameSocket.on('error', this.socketError)
    // gameSocket.on('disconnect', this.socketError)
    // gameSocket.on('connect_failed', this.socketError)
    // gameSocket.on('reconnect_failed', this.socketError)

    gameSocket.on('reconnecting', this.socketError)
    gameSocket.on('connect', data =>{
      console.log('Game connected, fetching data...')
      gameSocket.emit('update', {gameId: this.props.params.tournamentId})
    })
    gameSocket.on('update', this.updateGameData.bind(this))

    this.state = {
      modalIsOpen: false,
      timeRemaining: 30,
      status: {
        currentRound: 0,
        currentPhase: ''
      },
      items: [],
      playerList: [],
      candidateList: [],
      proposalList: [],
      rounds: [],
    }
  }

  // lifecycle
  componentDidMount(){
  }
  componentWillUnmount() {
    gameSocket.disconnect()
    clearInterval(intervalId)
  }

  // socket handlers
  updateGameData(data){
    const gameData = data.public
    console.log(gameData)

    // check gameState
    if(gameData.status.gameReady){
      this.setState({ })
    }

    if(gameData.status.gameInProgress){
      this.setState({
        status: gameData.status,
        timeRemaining: gameData.status.timeRemaining,
        rounds: gameData.rounds,
        items: gameData.itemList,
        playerList: gameData.playerList,
        candidateList: this.filterCandidates(gameData.candidateList, gameData.itemList),
        proposalList: gameData.rounds[gameData.status.currentRound].proposals.map(proposal => proposal.target)
      })

      // show counter display
      this.startCountdown()
    }

    if(gameData.status.gameComplete){
      this.setState({
        status: gameData.status,
        rounds: gameData.rounds,
        playerList: gameData.playerList
      })
    }

  }
  socketError(data){
    console.log('Reconnecting... Attempts:', data)
  }


  // Submit functions
  submitProposal(proposalTarget, proposalAction){
    console.log('Submit proposal: ', proposalTarget);
    gameSocket.emit('proposal', {
      round: this.status.currentRound,
      proposalTarget: proposalTarget,
      proposalAction: proposalAction
    })

  }
  submitVote(voteTarget, vote){
    console.log('Submit vote: ', proposalTarget.name);
    gameSocket.emit('vote', {
      round: this.status.currentRound,
      target: voteTarget,
      vote: vote,
    })

  }

  // display functions
  startCountdown(){
    clearInterval(intervalId)
    intervalId = setInterval(this.countDownTimer.bind(this), 1000)
  }
  countDownTimer(){
    let nextTick = this.state.timeRemaining - 1
    this.setState({timeRemaining: nextTick})
    if(nextTick === 0){
      clearInterval(intervalId)
      gameSocket.emit('update', {gameId: '5a7251f391b319a1c28e66da'})
    }
  }
  filterCandidates(baseArray, removeArray){
    const idArray = removeArray.map(item => item.symbol)
    return baseArray.filter(baseItem => !~idArray.indexOf(baseItem.symbol))
  }
  round(value, places){
    places = places || 4
    return +(Math.round(value + "e+" + places)  + "e-" + places);
  }
  // displayWei(input){
  //   let ethereum = ''
  //   let wei = input
  //   if(input){
  //     if(typeof(input) === 'object'){
  //       wei = wei.toNumber()
  //     }
  //     ethereum = this.round(web3.fromWei(wei, 'ether'), 5)
  //   }
  //   return 'Ξ' + ethereum + ' ETH ($' +
  //    this.round(this.state.exchangeRate * web3.fromWei(wei, 'ether')) + ')'
  // }
  format(input){
    if(typeof(input) === 'object'){
      input = input.toNumber()
    }
    return input
  }

  render() {
    return(

      <main style={{display: 'flex', flexDirection: 'column'}}>

        <div style={{flex: '1'}}>
          <LoginButton tournamentId={this.props.params.tournamentId}/>
          <time>{this.state.timeRemaining}</time>
        </div>

        <div style={{flex: '9', display: 'flex', flexDirection: 'row'}}>

          <div style={{flex: '4', display: 'flex', flexDirection: 'column'}}>

            <div className="game-panel" style={{flex: '5'}}>

              {this.state.status.currentPhase === 'proposals' ?

                <AddProposal
                  candidateList={this.state.candidateList}
                  itemList={this.state.items}
                  submitProposal={this.submitProposal}/>

              :null}
              {this.state.status.currentPhase === 'votes' ?

                <VoteOnProposal
                  proposalList={this.state.proposalList}
                  submitVote={this.submitVote.bind(this)}/>

              :null}
              {this.state.status.currentPhase === 'results' ?

                <RoundResults
                  resultsList={this.state.items}/>

              :null}
              {this.state.status.currentPhase === 'complete' ?

                <p>Complete</p>

              :null}

            </div>

            <div className="game-panel" style={{flex: '2'}}>
              <RoundProgress roundList={this.state.rounds}/>
            </div>

          </div>

          <div style={{flex: '2', display: 'flex', flexDirection: 'column'}}>
            <div className="game-panel" style={{flex: '2'}}>

              <PlayerList playerList={this.state.playerList}/>

            </div>
            <div className="game-panel" style={{flex: '5'}}>

              Chat

            </div>
          </div>

        </div>

      </main>
    )
  }
}


export default FormComponent
