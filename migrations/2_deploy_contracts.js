var ServesaFactory = artifacts.require("./ServesaFactory.sol");

// Deploy config
const nowUnix = new Date().getTime()/1000;
const nowParsed = parseInt(nowUnix.toFixed(0), 10);
// const config = {
//   ownerAddress: '',
//   contractName: 'testName',
//   ownerCanBurn: true,
//   ownerCanSpend: true,
//   tokenBasePrice: 10000000000000000, // 0.01 ether
//   tokenPriceExponent: 2,
//   sunsetWithdrawalPeriod: 5184000 // 2 months
// };
// Deploy new instance of MVP through factory
// if(network == "develop") {
//   return factory.newContract(
//     config.ownerAddress,
//     config.contractName,
//     config.ownerCanBurn,
//     config.ownerCanSpend,
//     config.tokenBasePrice,
//     config.tokenPriceExponent,
//     config.sunsetWithdrawalPeriod,
//     {from: accounts[0]}
//   )
//   .then(()=>{
//     return factory.getContractAddress.call({from: accounts[0]});
//   })
//   .then((staketree)=>{
//     console.log("Factory deployed address:", staketree);
//     return staketree;
//   })
//   .catch(error =>{
//     console.log(error);
//   });
// }


module.exports = function(deployer, network, accounts) {
  let factory;
  deployer.then(()=>{
    return ServesaFactory.new();
  })
  .then((instance)=>{
    factory = instance;
    console.log("Factory address: ", factory.address);
    return true;
  })
};
