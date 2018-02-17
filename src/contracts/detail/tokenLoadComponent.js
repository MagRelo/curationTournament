import React, { Component } from 'react'
import { Link } from 'react-router'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';


import TokenPriceChart from './tokenPriceChart'

// Forms
import BuyForm from './buyForm'
import SellForm from './sellForm'
import BurnForm from './burnForm'
import SpendForm from './spendForm'

import store from '../../store'
import ServesaContract from '../../../build/contracts/Servesa.json'

class FormComponent extends Component {
  constructor(props, { authData }) {
    super(props)
    authData = this.props
    this.state = {
      contractInstanceAddress: '0x40f8Da2C9B078F6693D80BaC02182268E8B1779a'
    }
  }

  render() {
    return(
      <main className="">

        <h3>Load Contract</h3>
        <form className="pure-form" onSubmit={this.getContractData.bind(this)}>

          <fieldset>
            <label>Contract Address</label>
            <input type="text" className="pure-input-1"
              value={this.state.contractInstanceAddress}
              onChange={(event)=>{this.setState({contractInstanceAddress: event.target.value})}}></input>
          </fieldset>

          <button
            className="pure-button pure-button-primary">Load Contract
          </button>

        </form>

      </main>
    )
  }
}


export default FormComponent
