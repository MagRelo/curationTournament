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
    this.props.loadList()
  }

  displayStatus(status){

    if(status.gameReady){
      return 'Ready'
    }

    if(status.gameInProgress){
      return 'In Progress'
    }

    if(status.gameComplete){
      return 'Complete'
    }

  }

  render() {
    return(
      <main>
        <h1>Tournaments</h1>

        {this.props.list.map(game => {

            return <div className="pure-u-1 pure-u-md-1-3 tile-outer" key={game._id}>
                <Link to={"/tourney/" + game._id}>
                  <div className="tile-inner">
                    <h3>{game.config.name}</h3>
                    <p> Status: {this.displayStatus(game.status)} </p>
                    <p> start: {game.status.phaseStartTime} </p>
                  </div>
                </Link>
              </div>

          })
        }

      </main>
    )
  }
}

export default TournamentList
