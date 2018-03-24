const Web3 = require('web3')
const truffleContract = require('truffle-contract');

const providerURLs = {
  local: 'wss://localhost:8545',
  ropsten: 'wss://ropsten.infura.io/ws',
  rinkeby: 'wss://rinkeby.infura.io/ws',
  mainnet: 'wss://mainnet.infura.io/ws'
}

exports.setupTruffleContract = function (contractNetwork, jsonInterface) {

    const provider = new Web3.providers.WebsocketProvider(providerURLs[contractNetwork])
    const contract = truffleContract(jsonInterface);
    contract.setProvider(currentProvider);

    return fixTruffleContractCompatibilityIssue(contract);
}

// Workaround for a compatibility issue between web3@1.0.0-beta.29 and truffle-contract@3.0.3
// https://github.com/trufflesuite/truffle-contract/issues/57#issuecomment-331300494
function fixTruffleContractCompatibilityIssue(contract) {
    if (typeof contract.currentProvider.sendAsync !== "function") {
        contract.currentProvider.sendAsync = function() {
            return contract.currentProvider.send.apply(
                contract.currentProvider, arguments
            );
        };
    }
    return contract;
}
