import React, { Component } from 'react'
import { Link } from 'react-router'

import Modal from 'react-modal';
const customStyles = {
  overlay: {
   backgroundColor   : 'rgba(16, 58, 82, 0.75)'
  },
  content : {
    top                   : '50%',
    left                  : '50%',
    right                 : 'auto',
    bottom                : 'auto',
    marginRight           : '-40%',
    transform             : 'translate(-50%, -50%)',
    padding               : 'none'
  }
};

class WrappedModal extends Component {
  constructor(props, { authData }) {
    super(props)
    authData = this.props
  }

  render() {
    return(

      <Modal
        isOpen={this.props.modalIsOpen}
        onAfterOpen={this.props.afterOpenModal}
        onRequestClose={this.props.closeModal}
        style={customStyles}
        contentLabel="">

          <div className="confirm-container">

            <div className="confirm-title-container">
              <span className="title">Transaction</span>
            </div>

            <div className="confirm-body-container">

              {this.props.transactionPending ?

                <div>
                  <p>Handing off to Web3 provider...</p>
                  <div className="spinner"></div>
                </div>

              :null}

              {!this.props.transactionPending && this.props.transactionError ?

                <div>
                  <p>Error!</p>
                  <p>{this.props.transactionMessage}</p>
                </div>

              :null}

              {!this.props.transactionPending && !this.props.transactionError ?

                <div>
                  <p>Success!</p>
                  <p>You can view this transaction on Etherscan: &nbsp;
                    <span>
                      <a className="pure-link-primary"
                        href={"https://rinkeby.etherscan.io/tx/" + this.props.transactionID}
                        target="_blank">View Transaction</a>
                    </span>
                  </p>
                  <p>After the transaction has been confirmed you can refresh the contract to see the updated contract data.</p>
                </div>

              :null}

              <div style={{textAlign: 'right'}}>
                <button className="pure-button pure-button-primary"
                  onClick={this.props.closeModal}>OK
                </button>
              </div>

            </div>
          </div>
        </Modal>

    )
  }
}

export default WrappedModal
