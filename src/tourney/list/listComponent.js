import React, { Component } from 'react'
import { Link } from 'react-router'
import {Tokenizer}  from 'react-typeahead';

class ContractList extends Component {
  constructor(props, { authData }) {
    super(props)
    authData = this.props
    this.state = {
    }
  }

  componentDidMount(){
    this.props.loadList()
  }

  render() {
    return(
      <main>
        <h1>Tournaments</h1>

        {this.props.list.map(game => {

            return <div className="pure-u-1 pure-u-md-1-3 tile-outer" key={game._id}>
                <Link to={"/tourney/" + game._id}>
                  <div className="tile-inner">
                    <h3> {game.status.tournamentStart} </h3>
                  </div>
                </Link>
              </div>

          })
        }

      </main>
    )
  }
}

export default ContractList
