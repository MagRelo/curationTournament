import React, { Component } from 'react'
import { Link } from 'react-router'

// sockets
import io from 'socket.io-client';
let gameSocket

// timer
let intervalId = 0

//
// import AddProposal from './components/addProposal'
import VoteOnProposal from './components/question'
import RoundResults from './components/results'
import RoundProgress from './components/roundProgress'
import PlayerList from './components/playerList'

function ImageButton(props){
  const {name, imgUrl, row, column, submitVote, selected} = props
  let styleObject = {
      gridRow: row,
      gridColumn: column,
      backgroundImage: 'url(' + imgUrl + ')',
      backgroundPosition: 'center',
      backgroundSize: 'cover'
    }

  if(selected){
    styleObject.border = 'solid orange 10px'
  }

  return <div
      style={styleObject}
      onClick={()=> submitVote(name)}>

      <div style={{
          background: 'linear-gradient( to bottom, black, rgba(255, 0, 0, 0) )',
          padding: '0.5em',
          fontSize: '2em'}}>

          {name}
      </div>
    </div>
}

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
      status: {
        gameState: '',
        timeRemaining: 10
      },
      config: {
        lengthOfPhase: 15
      },
      question: 'What\'s the best cat?',
      options: [
        {_id: 1, name: 'jimmy', imgUrl: 'https://d17fnq9dkz9hgj.cloudfront.net/uploads/2012/11/144334862-giving-cat-bath-632x475.jpg'},
        {_id: 2, name: 'pete', imgUrl: 'https://d17fnq9dkz9hgj.cloudfront.net/uploads/2012/11/155310872-is-cat-stray-632x475.jpg'},
        {_id: 3, name: 'richard', imgUrl: 'https://d17fnq9dkz9hgj.cloudfront.net/uploads/2013/09/cat-black-superstitious-fcs-cat-myths-162286659.jpg'},
        {_id: 4, name: 'baxter', imgUrl: 'https://www.royalcanin.com/~/media/Royal-Canin/Product-Categories/cat-adult-landing-hero.ashx'},
      ],
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


  submitVote(name){

    console.log('Submitting vote:', name)

    const web3 = this.props.web3.web3Instance
    const userAddress = this.props.userAddress

    // setup signature data
    const questionString = this.state.question
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
          userAddress: userAddress,
          descriptionString: questionString,
          vote: name,
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
      gameSocket.emit('update', {gameId: this.props.params.tournamentId})
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
            config={this.state.config}
            status={this.state.status}/>
        </div>

        <ImageButton
          name={this.state.options[0].name}
          imgUrl={this.state.options[0].imgUrl}
          selected={true}
          row="2"
          column="2"
          submitVote={this.submitVote.bind(this)}/>

        <ImageButton
          name={this.state.options[1].name}
          imgUrl={this.state.options[1].imgUrl}
          selected={false}
          row="2"
          column="3"
          submitVote={this.submitVote.bind(this)}/>

        <ImageButton
          name={this.state.options[2].name}
          imgUrl={this.state.options[2].imgUrl}
          selected={false}
          row="3"
          column="2"
          submitVote={this.submitVote.bind(this)}/>

        <ImageButton
          name={this.state.options[3].name}
          imgUrl={this.state.options[3].imgUrl}
          selected={false}
          row="3"
          column="3"
          submitVote={this.submitVote.bind(this)}/>


      </div>
    )
  }
}


export default FormComponent
