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


class FormComponent extends Component {
  constructor(props) {
    super(props)


    // connect to game
    gameSocket = io('http://localhost:8080/game');

    gameSocket.on('error', this.socketError)
    // gameSocket.on('disconnect', this.socketError)
    // gameSocket.on('connect_failed', this.socketError)
    // gameSocket.on('reconnect_failed', this.socketError)
    gameSocket.on('reconnecting', this.socketError)
    gameSocket.on('connect', data =>{

      // gameSocket.emit('update', {gameId: this.props.params.tournamentId})
      console.log('Game connected')
    })
    gameSocket.on('update', this.updateGameData.bind(this))

    this.state = {
      loading: false,
      timeRemaining: -1,
      status: {
        currentRound: 0,
        gameState: ''
      },
      config: { name: '' },
      items: [],
      playerList: [],
      candidateList: [],
      predictions: [],
      rounds: [],
      userData: {
        votes: []
      }
    }
  }

  // lifecycle
  componentDidMount(){

    // wait for web3 to be injected
    let intId = 0
    if(this.props.web3.web3Instance){

      console.log('web3 ready');


      gameSocket.emit('update', {gameId: this.props.params.tournamentId, userAddress: this.props.userAddress})
      this.setState({ready: true})

    } else {
      intId = setInterval(watchForWeb3.bind(this), 500)
    }

    function watchForWeb3(){
      if(this.props.web3.web3Instance){

        console.log('web3 found');

        gameSocket.emit('update', {gameId: this.props.params.tournamentId, userAddress: this.props.userAddress})
        this.setState({ready: true})

        // clear timer
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
    if(gameData.status.gameState === 'ready' ||
        gameData.status.gameState === 'closed'){

      this.setState({
        config: gameData.config,
        playerList: gameData.playerList,
        items: gameData.itemList
      })

    }

    if(gameData.status.gameState === 'proposals' ||
        gameData.status.gameState === 'voting' ||
        gameData.status.gameState === 'results'){

      this.setState({
        config: gameData.config,
        status: gameData.status,
        timeRemaining: gameData.status.timeRemaining,
        rounds: gameData.rounds,
        items: gameData.itemList,
        playerList: gameData.playerList,
        candidateList: this.filterCandidates(gameData.candidateList, gameData.itemList),
        predictions: gameData.predictions.filter(prediction => {
          return prediction.round === gameData.status.currentRound
        }),
        userData: gameData.userData
      })

      // show counter display
      if(gameData.status.timeRemaining > 0){
        // this.startCountdown()
      }

    }

    if(gameData.status.gameState === 'closed'){
      this.setState({
        status: gameData.status,
        rounds: gameData.rounds,
        playerList: gameData.playerList
      })

      this.endCountdown()
    }

  }
  socketError(data){
    if(data > 5){
      gameSocket.disconnect()
      clearInterval(intervalId)
      console.log('disconnecting')
    } else {
      console.log('reconnection attempts: ', data)
    }
  }


  // Submit functions
  submitProposal(proposalTarget, proposalAction){

    console.log('Submit proposal: ', proposalAction)

    const web3 = this.props.web3.web3Instance
    const userAddress = this.props.userAddress
    const gameId = this.props.params.tournamentId
    const currentRound = this.state.status.currentRound

    // setup signature data
    const descriptionString = '\"' + proposalAction
      + ' ' + proposalTarget.name
      + (proposalAction === 'add' ? ' to' : ' from'  )
      + ' list\"'
    const msgParams = [
      {
        name: 'Proposal',
        type: 'string',
        value: descriptionString
      },
      {
        name: 'Round',
        type: 'uint',
        value: currentRound
      },
      {
        name: 'Game ID',
        type: 'string',
        value: gameId
      }
    ]

    web3.currentProvider.sendAsync({
        method: 'eth_signTypedData',
        params: [msgParams, userAddress],
        from: userAddress,
      }, function (err, result) {
        if (err) return console.error(err)
        if (result.error) return console.error(result.error.message)

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
    const descriptionString = '\"' + selectedProposal.action + ' ' + selectedProposal.target.name + ' to list\"'
    const msgParams = [
      {
        name: 'Proposal',
        type: 'string',
        value: descriptionString
      },
      {
        name: 'Your vote',
        type: 'string',
        value: (vote ? 'Agree':'Disagree')
      },
      {
        name: 'Proposal ID',
        type: 'string',
        value: selectedProposal._id
      }
    ]

    web3.currentProvider.sendAsync({
        method: 'eth_signTypedData',
        params: [msgParams, userAddress],
        from: userAddress,
      }, function (err, result) {
        if (err) return console.error(err)
        if (result.error) return console.error(result.error.message)

        // send to server
        gameSocket.emit('vote', {
          userAddress: userAddress,
          gameId: gameId,
          currentRound: currentRound,
          descriptionString: descriptionString,
          proposalId: selectedProposal._id,
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
  endCountdown(){
    clearInterval(intervalId)
  }
  countDownTimer(){
    let nextTick = this.state.timeRemaining - 1
    this.setState({timeRemaining: nextTick})
    if(nextTick <= 0 && nextTick % 2 === 0){
      this.setState({timeRemaining: 0})
      gameSocket.emit('update', {gameId: this.props.params.tournamentId})
    }
  }

  filterCandidates(baseArray, removeArray){
    const idArray = removeArray.map(item => item.symbol)
    return baseArray.filter(baseItem => !~idArray.indexOf(baseItem.symbol))
  }
  round(value, places){
    places = places || 4
    return Number((Math.round(value + "e" + places)  + "e-" + places));
  }
  format(input){
    if(typeof(input) === 'object'){
      input = input.toNumber()
    }
    return input
  }


  render() {
    return(

      <main style={{display: 'flex', flexDirection: 'column'}}>

        <div className="game-panel white-bg" style={{flex: '2'}}>

          <h3>{this.state.config.name}</h3>
          <p>Contract: {this.state.config.contractAddress}</p>
          <p>Network: {this.state.config.contractNetwork}</p>
          <p>Value: {this.state.config.contractValue}</p>
          <p>Status: {this.state.status.currentStatus}</p>

        </div>

        <div style={{flex: '9', display: 'flex', flexDirection: 'row'}}>
          <div style={{flex: '3', display: 'flex', flexDirection: 'column'}}>

            <div className="game-panel white-bg" style={{flex: '1'}}>

              <PlayerList
                playerList={this.state.playerList}
                currentAccount={this.props.userAddress || ''}/>

            </div>
            <div className="game-panel white-bg" style={{flex: '1'}}>

              <h3>Chat</h3>

            </div>

          </div>
          <div className="game-panel white-border" style={{flex: '7'}}>

            <RoundProgress
              config={this.state.config}
              status={this.state.status}/>

            {this.state.status.gameState === 'proposals' ?

              <AddProposal
                candidateList={this.state.candidateList}
                itemList={this.state.items}
                submitProposal={this.submitProposal.bind(this)}
                userData={this.state.userData}/>

            :null}
            {this.state.status.gameState === 'voting' ?

              <VoteOnProposal
                proposalList={this.state.predictions}
                submitVote={this.submitVote.bind(this)}/>

            :null}
            {this.state.status.gameState === 'results' ?

              <RoundResults
                proposalList={this.state.predictions}
                votesList={this.state.userData.userVotes.filter(vote => vote.round === this.state.status.currentRound)}/>

            :null}
            {this.state.status.gameState === 'closed' ?


              <div className="game-panel">
                <h3> Final List </h3>

                <ul style={{padding: 0}}>
                  {this.state.items.map(item => {
                    return <li style={{listItem: 'none'}} key={item._id}>

                      <div className="game-panel white-bg">
                        <div style={{margin: '8px'}}>
                          <span>{this.descriptionString(item)}</span>
                        </div>

                      </div>

                    </li>
                  })}
                </ul>

              </div>

            :null}

          </div>
        </div>

      </main>
    )
  }
}


export default FormComponent
