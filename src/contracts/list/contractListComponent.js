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
      <main className="pure-g">
        <h1>Groups</h1>

        {this.props.list.map(contract => {

            return <div className="pure-u-1 pure-u-md-1-3 tile-outer" key={contract.deployedAddress}>
                <Link to={"/contract/" + contract.deployedAddress}>
                  <div className="tile-inner">
                    <h3> {contract.contractOptions.contractName} </h3>
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
