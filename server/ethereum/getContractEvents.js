const Web3 = require('web3')

// TODO: move to config
function getProviderUrl(contractNetwork){

  const providerURLs = {
    local: 'wss://localhost:8545',
    ropsten: 'wss://ropsten.infura.io/ws',
    rinkeby: 'wss://rinkeby.infura.io/ws',
    mainnet: 'wss://mainnet.infura.io/ws'
  }

  return providerURLs[contractNetwork]
}

let backoff = 1
function listenToEvent(contractAddress, contractNetwork) {

    // setup web3 for network
    const providerUrl = getProviderUrl(contractNetwork)
    console.log('connecting to network', "\x1b[33m" ,contractNetwork, '\x1b[0m', 'at', '\x1b[33m', providerUrl, '\x1b[0m');
    const provider = new Web3.providers.WebsocketProvider(providerUrl)
    const web3 = new Web3(provider)

    // watch for new block headers
    web3.eth.subscribe('newBlockHeaders', (error, result) => {

      if (error){
        console.error('Error in block header subscription:')
        console.error(error)

        // increment backoff
        backoff = backoff * 2
        if(backoff < 30){
          console.error('retrying in', backoff, 'seconds')
          setTimeout(function() {
            listenToEvent(contractAddress, contractNetwork)
          }, backoff * 1000)
        } else {
          console.log("cancelling watch for network", contractNetwork);
        }
      }
    })
    .on('data', (blockHeader) => {

      // If block isn't pending, check block txs for interation with observed contracts.
      if (blockHeader.number !== null){

        // get block and look for our contract
        const blockNumber = blockHeader.number
        web3.eth.getBlock(blockNumber, true).then((block) => {

          if(!block){
            return console.log('got block', blockNumber, 'txns: ', 0);
          }

          const txs = block.transactions
          console.log('got block', blockNumber, 'txns: ', txs.length);

          // Loop through txs looking for contract address
          for (var i = 0; i < txs.length; i++){

            if(contractAddress === txs[i].from || contractAddress === txs[i].to){
                // this is us...
                console.log('this is us!', txn[i].value)
              }

          }

          return
        })
        .catch((error) => {
          console.error('Error in block fetching:')
          console.error(error)
        })

      }

    })

}

exports.watchForContractTxn = function(contractAddress, contractNetwork) {
  listenToEvent(contractAddress, contractNetwork);
}
