import React, { Component } from 'react'
import { Link } from 'react-router'

// sockets
import io from 'socket.io-client';
let gameSocket

// timer
let intervalId = 0

import QuestionPanel from './components/questionPanel'
import ResultsPanel from './components/resultsPanel'

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

      gameSocket.emit('requestData')
      console.log('Game connected')
    })

    gameSocket.on('update', this.updateGameData.bind(this))

    this.state = {
      loading: false,
      question: '',
      options: [],
      userData: {},
      playerList: []
    }
  }

  // lifecycle
  componentDidMount(){

    // wait for web3 to be injected
    let intId = 0
    if(this.props.web3.web3Instance){

      console.log('web3 ready');


      // gameSocket.emit('requestData')
      this.setState({ready: true})

    } else {
      intId = setInterval(watchForWeb3.bind(this), 500)
    }

    function watchForWeb3(){
      if(this.props.web3.web3Instance){

        console.log('web3 found');

        // gameSocket.emit('requestData')
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
    const gameData = data.gameData
    console.log(gameData)

    this.setState({
      gameId: gameData._id,
      questionId: gameData.currentQuestion._id,
      lengthOfPhase: gameData.lengthOfPhase,
      phase: gameData.phase,
      phaseStartTime: gameData.phaseStartTime,
      timeRemaining: gameData.timeRemaining,
      playerList: gameData.contributors,
      userData: gameData.userData,
      question: gameData.currentQuestion.question,
      options: gameData.currentQuestion.options
    })

    // show counter display
    if(gameData.timeRemaining > 0){
      // this.startCountdown()
    } else {
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

  submitVote(name, answerIndex){

    console.log('Submitting vote:', name)

    const web3 = this.props.web3.web3Instance
    const userAddress = this.props.userAddress

    // setup signature data
    const questionString = this.state.question
    const gameId = this.state.gameId
    const questionId = this.state.questionId

    const msgParams = [
      {
        name: 'Question',
        type: 'string',
        value: questionString
      },
      {
        name: 'Your vote',
        type: 'string',
        value: name
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
          questionString: questionString,
          vote: name,
          answerIndex: answerIndex,
          answer: name,
          questionId: questionId,
          gameId: gameId,
          userAddress: userAddress,
          signature: result.result
        })

        console.log('Submitted:', name)
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
      gameSocket.emit('requestData', {gameId: this.props.params.tournamentId})
    }
  }

  render() {
    return(

      <div style={{height: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: 'auto 1fr 1fr', gridGap: '1em'}}>

        <div style={{gridRow: '1 / 4', gridColumn:'1'}}>
          <PlayerList
            playerList={this.state.playerList}
            currentAccount={this.props.userAddress || ''}/>
        </div>

        <div style={{gridRow: '1', gridColumn:'2 / 4'}}>

          <RoundProgress
            question={this.state.question}
            lengthOfPhase={this.state.lengthOfPhase}
            timeRemaining={this.state.timeRemaining}/>

        </div>


      {this.state.phase === 'question' ?

        <QuestionPanel
          options={this.state.options}
          submitVote={this.submitVote.bind(this)}/>

      :null}

      {this.state.phase === 'results' ?

        <ResultsPanel options={this.state.options}/>

      :null}

      </div>
    )
  }
}


export default FormComponent
