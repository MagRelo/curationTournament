import React, { Component } from 'react'
import { Link } from 'react-router'

import WrappedModal from '../confirmationModal'


class FormComponent extends Component {
  constructor(props) {
    super(props)
    this.state = {
      modalIsOpen: false,
      loading: true,
      exchangeRate: 0,
      balance: 0,
      tokens: 0,
      buyPrice: 0,
      sellPrice: 0,
      contractInstanceAddress: this.props.contractId,
      burnCount: 0,
      burnAddress: '',
      drainAmount: 0,
      tokensToPurchase: 0,
      purchasePrice: 0,
      tokensToSell: 0,
      history: []
    }

    this.openModal = this.openModal.bind(this);
    this.afterOpenModal = this.afterOpenModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
  }

  // Modal functions
  openModal() { this.setState({modalIsOpen: true})}
  afterOpenModal() {}
  closeModal() { this.setState({modalIsOpen: false})}

  componentDidMount(){

    fetch("https://api.coinmarketcap.com/v1/ticker/ethereum/?convert=USD")
      .then(res => {return res.json()})
      .then(data => {
        this.setState({
          exchangeRate: parseInt(data[0].price_usd, 10)
        });
      });

    fetch("https://rinkeby.etherscan.io/api?module=account&action=txlist&address=" + this.props.contractId + "&startblock=0&endblock=99999999&sort=desc&apikey=" + "XFWXCMBMV2HXW3QIMQSUS7NXXRZHVUS6HU")
      .then(res => {return res.json()})
      .then(data => {
        this.setState({
          history: data.result
        });
      });

      // wait for web3 to be injected
      let intId = 0
      if(this.props.web3.web3Instance){
        this.props.getContract(this.props.contractId)
      } else {
        intId = setInterval(watchForWeb3.bind(this), 500)
      }
      function watchForWeb3(){
        if(this.props.web3.web3Instance){
          this.props.getContract(this.props.contractId)
          clearInterval(intId);
        } else {
          console.log('watching for web3...')
        }
      }

  }


  buyOnChange(event){
    this.setState({
      tokensToPurchase: event.target.value,
      purchasePrice: this.props.calcPurchasePrice(
        event.target.value,
        this.props.contract.maxTokens.toNumber() - this.props.contract.tokens.toNumber(),
        this.props.contract.tokens.toNumber(),
        this.props.contract.tokenBasePrice.toNumber(),
        this.props.contract.tokenPriceLinearDivisor.toNumber(),
        this.props.contract.tokenPriceExponentDivisor.toNumber())
    })
  }
  buyTokens(event){
    event.preventDefault()
    this.openModal()
    this.props.buyTokens(this.props.contractId, Math.ceil(this.state.purchasePrice))
    this.setState({tokensToPurchase: 0})
  }

  sellOnChange(event){
    this.setState({
      tokensToSell: event.target.value,
      sellTotal: (event.target.value * this.state.sellPrice)
    })
  }
  sellTokens(event){
    event.preventDefault()
    this.openModal()
    this.props.sellTokens(this.props.contractId, this.state.tokensToSell)
  }

  burnTokens(event){
    event.preventDefault()
    this.openModal()
    this.props.burnTokens(this.props.contractId, this.state.burnCount)
  }

  drainEscrow(event){
    event.preventDefault()
    this.openModal()
    this.props.drainEscrow(this.props.contractId, this.state.drainAmount)
  }

  round(value, places){
    places = places || 4
    return +(Math.round(value + "e+" + places)  + "e-" + places);
  }

  displayWei(input){

    let ethereum = ''
    let wei = input
    if(input){

      if(typeof(input) === 'object'){
        wei = wei.toNumber()
      }

      ethereum = this.round(web3.fromWei(wei, 'ether'), 5)
    }


    return 'Ξ' + ethereum + ' ETH ($' +
     this.round(this.state.exchangeRate * web3.fromWei(wei, 'ether')) + ')'
  }

  format(input){
    if(typeof(input) === 'object'){
      input = input.toNumber()
    }

    return input
  }

  render() {
    return(

      <main className="">

        {this.props.contractLoading ?

            <div style={{textAlign: 'center', marginTop: '10em'}}>
              <p>MetaMask detected: {!!this.props.web3.web3Instance ? 'Yes' : 'Loading...'}</p>
              <p>MetaMask account detected: {!!this.props.web3.accounts[0] ? 'Yes' : 'Loading...'}</p>
              <p>{!this.props.contract ? 'Yes' : 'Loading blockchain data...'}</p>
              <div className="spinner"></div>
            </div>

          :

        <div>
          <h3>Contract name</h3>
          <div className="pad-box">
              <h1>{this.props.contract.contractName}</h1>
          </div>

          <div>
            <h3>Contract details</h3>
            <div className="pure-g">
              <div className="pure-u-1 pure-u-md-1-2">
                <div className="pad-box">
                  <p>Contact balance: <span>{this.displayWei(this.props.contract.balance)}</span></p>
                  <p>Tokens issued: <span> {this.format(this.props.contract.tokens)}</span></p>
                  <p>Token holders: <span>{this.format(this.props.contract.funders)}</span></p>

                  <p>Max tokens: <span>{this.format(this.props.contract.maxTokens)}</span> </p>
                  <p>Token base price: <span> {this.displayWei(this.props.contract.tokenBasePrice)}</span></p>
                  <p>Token pricing linear divisor: <span>{this.format(this.props.contract.tokenPriceLinearDivisor)}</span></p>
                  <p>Token pricing exponent divisor: <span>{this.format(this.props.contract.tokenPriceExponentDivisor)}</span></p>
                </div>
              </div>

              <div className="pure-u-1 pure-u-md-1-2">
                <div className="pad-box">
                  <p>Contract owner: &nbsp;
                    <span>
                      <a className="pure-link-primary"
                        href={"https://rinkeby.etherscan.io/address/" + this.props.contract.owner}
                        target="_blank">View Owner Account
                      </a>
                    </span>
                  </p>
                  <p>Owner can burn: <span>{this.props.contract.ownerCanBurn ? 'Yes': 'No'}</span></p>
                  <p>Owner can drain: <span>{this.props.contract.ownerCanDrain ? 'Yes': 'No'}</span></p>
                  <p>Etherscan: &nbsp;
                    <span>
                      <a className="pure-link-primary"
                        href={"https://rinkeby.etherscan.io/address/" + this.props.contractId}
                        target="_blank">View Contract
                      </a>
                    </span>
                  </p>
                  <p>
                  <span>
                    <button
                      className="pure-button pure-button-primary"
                      onClick={()=>{this.props.getContract(this.props.contractId)}}>Refresh Data</button>
                  </span>
                  </p>
                </div>
              </div>

            </div>
          </div>

          <div className="pure-g">
            <div className="pure-u-1 pure-u-md-1-2 pad-box">

              <h3>Buy</h3>
              <form className="pure-form" onSubmit={this.buyTokens.bind(this)}>
                <fieldset>
                  <p>Next token price: <span>{this.displayWei(this.state.buyPrice)}</span></p>
                  <label>Tokens to purchase (max: {this.state.maxTokens - this.state.tokens})</label>
                  <input
                    className="pure-input-1"
                    type="number"
                    value={this.state.tokensToPurchase}
                    max={this.props.contract.maxTokens - this.props.contract.tokens}
                    min="0"
                    onChange={this.buyOnChange.bind(this)}></input>
                  <p>Total: <span>{this.displayWei(this.state.purchasePrice)} </span></p>
                </fieldset>
                <div style={{textAlign: 'right'}}>
                  <button
                    type="submit"
                    className="pure-button pure-button-primary"
                    disabled={this.state.tokensToPurchase < 1}>Buy
                  </button>
                </div>
              </form>

            </div>
            <div className="pure-u-1 pure-u-md-1-2 pad-box">

              <h3>Sell</h3>
              <form className="pure-form" onSubmit={this.sellTokens.bind(this)}>
                <fieldset>
                  <p>Sell price: <span>{this.displayWei(this.state.sellPrice)}</span></p>
                  <label>Tokens to sell (Max:{this.format(this.props.contract.activeAccountTokens)})</label>
                  <input type="text" className="pure-input-1"
                    type="number"
                    value={this.state.tokensToSell}
                    max={this.props.contract.activeAccountTokens.toNumber()}
                    min="0"
                    onChange={this.sellOnChange.bind(this)}></input>
                  <p>Total: <span>{this.displayWei(this.state.sellTotal)} </span></p>
                </fieldset>
                <div style={{textAlign: 'right'}}>
                  <button
                    type="submit"
                    className="pure-button pure-button-primary"
                    disabled={this.state.tokensToSell < 1}>Sell</button>
                </div>
              </form>

            </div>

          </div>



          {!this.props.contract.activeAccountIsOwner ? null :
          <div className="pure-g">
            <div className="pure-u-1 pure-u-md-1-2 pad-box">

              <h3>Burn </h3>
              <form className="pure-form" onSubmit={this.burnTokens.bind(this)}>

                <label>Burn Address</label>
                <input type="text" className="pure-input-1"
                  type="text"
                  value={this.state.burnAddress}
                  onChange={(event)=>{this.setState({burnAddress: event.target.value})}}></input>
                <label>Burn Count</label>
                <input type="text" className="pure-input-1"
                  type="number"
                  value={this.state.burnCount}
                  onChange={(event)=>{this.setState({burnCount: event.target.value})}}></input>

                <div style={{textAlign: 'right'}}>
                  <button className="pure-button pure-button-primary"
                    disabled={this.state.burnCount < 1}>Burn</button>
                </div>
              </form>
          </div>
          <div className="pure-u-1 pure-u-md-1-2 pad-box">

            <h3>Drain </h3>
            <form className="pure-form" onSubmit={this.drainEscrow.bind(this)}>
              <label>Drain Amount</label>
              <input type="text" className="pure-input-1"
                type="number"
                value={this.state.drainAmount}
                onChange={(event)=>{this.setState({drainAmount: event.target.value})}}></input>

              <div style={{textAlign: 'right'}}>
                <button
                  className="pure-button pure-button-primary"
                  disabled={this.state.drainAmount <= 0}>Drain</button>
              </div>
            </form>

          </div>

        </div>
        }

        <h3>Transactions ({this.state.history.length})</h3>
        <div style={{marginLeft: '1em'}}>
          <table className="pure-table pure-table-horizontal table-100">
            <thead>
              <tr>
                <td>From</td>
                <td>Value</td>
                <td>Link</td>
              </tr>
            </thead>
            <tbody>

              {this.state.history.map((transaction)=>{
                return <tr key={transaction.hash}>

                    <td>{transaction.from}</td>
                    <td>{this.displayWei(transaction.value)}</td>
                    <td>
                      <a className="pure-link-primary" target="_blank" href={"https://rinkeby.etherscan.io/tx/" + transaction.hash}> &rarr; </a>
                    </td>
                </tr>
              })}

            </tbody>
          </table>
        </div>

        <WrappedModal
          modalIsOpen={this.state.modalIsOpen}
          onAfterOpen={this.afterOpenModal}
          closeModal={this.closeModal}
          transactionPending={this.props.transactionPending}
          transactionID={this.props.transactionID}/>

      </div>

      // "loading"
    }

      </main>
    )
  }
}


export default FormComponent
