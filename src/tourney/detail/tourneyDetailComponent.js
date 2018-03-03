import React, { Component } from 'react'
import { Link } from 'react-router'

// sockets
import io from 'socket.io-client';
let gameSocket

// timer
let intervalId = 0

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
      predictions: [],
      rounds: [],
    }
  }

  // lifecycle
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

        // setup sockets here(?)

        // connect to game
        gameSocket = io('http://localhost:8080/game');

        gameSocket.on('error', this.socketError)
        // gameSocket.on('disconnect', this.socketError)
        // gameSocket.on('connect_failed', this.socketError)
        // gameSocket.on('reconnect_failed', this.socketError)
        gameSocket.on('reconnecting', this.socketError)
        gameSocket.on('connect', data =>{
          console.log('Game connected, fetching data...')
          gameSocket.emit('update', {gameId: this.props.params.tournamentId, userAddress: this.props.userAddress})
        })
        gameSocket.on('update', this.updateGameData.bind(this))

        this.setState({ready: true})
        clearInterval(intId);
      } else {
        console.log('watching for web3...')
      }
    }

  }
  componentWillUnmount() {
    gameSocket.disconnect()
    clearInterval(intervalId)
  }

  // socket handlers
  updateGameData(data){
    const gameData = data
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
        predictions: gameData.predictions.filter(prediction => {
          return prediction.round === gameData.status.currentRound
        })

      })

      // show counter display
      // this.startCountdown()
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
    console.log('error', data)
  }


  // Submit functions
  submitProposal(proposalTarget, proposalAction){

    console.log('Submit proposal: ', proposalAction)

    const web3 = this.props.web3.web3Instance
    const userAddress = this.props.userAddress
    const gameId = this.props.params.tournamentId
    const currentRound = this.state.status.currentRound

    const descriptionString = 'Proposal: ' + proposalAction + ' ' + proposalTarget.symbol
    const msgParams = [
      {
        name: 'Description',
        type: 'string',
        value: descriptionString
      },
      {
        name: 'gameID',
        type: 'string',
        value: gameId
      },
      {
        name: 'Round',
        type: 'uint',
        value: currentRound
      },
      {
        name: 'Action',
        type: 'string',
        value: proposalAction
      },
      {
        name: 'Target',
        type: 'string',
        value: proposalTarget.symbol
      }
    ]

    web3.currentProvider.sendAsync({
        method: 'eth_signTypedData',
        params: [msgParams, userAddress],
        from: userAddress,
      }, function (err, result) {
        if (err) return console.error(err)
        if (result.error) { return console.error(result.error.message) }

        // send to server
        gameSocket.emit('proposal', {
          gameId: gameId,
          round: currentRound,
          userAddress: userAddress,
          signature: result.result,
          target: proposalTarget,
          action: proposalAction,
          descriptionString: descriptionString
        })

      })
  }

  submitVote(selectedProposal, vote){

    console.log('Submit vote: ', selectedProposal.target.name)

    const web3 = this.props.web3.web3Instance
    const userAddress = this.props.userAddress
    const gameId = this.props.params.tournamentId
    const currentRound = this.state.status.currentRound

    // setup signature data
    const descriptionString = selectedProposal.action + ' ' + selectedProposal.target.name + ': ' + (vote ? 'Yes':'No')
    const msgParams = [
      {
        name: 'Description',
        type: 'string',
        value: descriptionString
      },
      {
        name: 'proposalID',
        type: 'string',
        value: selectedProposal._id
      },
      {
        name: 'Vote',
        type: 'uint',
        value: vote
      },
  ]


    web3.currentProvider.sendAsync({
        method: 'eth_signTypedData',
        params: [msgParams, userAddress],
        from: userAddress,
      }, function (err, result) {
        if (err) return console.error(err)
        if (result.error) { return console.error(result.error.message) }

        // send to server
        gameSocket.emit('vote', {
          userAddress: userAddress,
          gameId: gameId,
          currentRound: currentRound,
          descriptionString: descriptionString,
          proposalID: selectedProposal._id,
          vote: vote,
          signature: result.result
        })
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
      gameSocket.emit('update', {gameId: this.props.params.tournamentId})
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

        <div style={{flex: '1', display: 'flex', flexDirection: 'row'}}>

          <div style={{flex: '1', display: 'flex', flexDirection: 'column'}}>

            <div className="game-panel" style={{flex: '2'}}>

              <RoundProgress roundList={this.state.rounds} timeRemaining={this.state.timeRemaining}/>

            </div>
            <div className="game-panel" style={{flex: '2'}}>

              <PlayerList
                playerList={this.state.playerList}
                currentAccount={this.props.userAddress || ''}/>

            </div>

          </div>

          <div style={{flex: '7', display: 'flex', flexDirection: 'column'}}>
            <div className="game-panel" style={{flex: '5'}}>

                {this.state.status.currentPhase === 'proposals' ?

                  <AddProposal
                    candidateList={this.state.candidateList}
                    itemList={this.state.items}
                    submitProposal={this.submitProposal.bind(this)}/>

                :null}
                {this.state.status.currentPhase === 'votes' ?

                  <VoteOnProposal
                    proposalList={this.state.predictions}
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

              Chat

            </div>
          </div>

        </div>

      </main>
    )
  }
}


export default FormComponent
