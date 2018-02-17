pragma solidity 0.4.18;
import './Servesa.sol';

contract ServesaFactory {
  uint public contractCount;
  mapping(address => address[]) public contracts;

  function newContract(
    address ownerAddress,
    string contractName,
    string contractAvatarUrl,
    bool ownerCanBurn,
    bool ownerCanSpend,
    uint maxTokens,
    uint tokenBasePrice,
    uint tokenPriceExponentDivisor,
    uint tokenPriceLinearDivisor,
    uint sunsetWithdrawPeriod) public returns (address newAddress) {

    Servesa contractId = new Servesa(
      ownerAddress,
      contractName,
      contractAvatarUrl,
      ownerCanBurn,
      ownerCanSpend,
      maxTokens,
      tokenBasePrice,
      tokenPriceExponentDivisor,
      tokenPriceLinearDivisor,
      sunsetWithdrawPeriod
    );

    contracts[msg.sender].push(contractId);
    contractCount += 1;

    return contractId;
  }

  function getContractAddress() public constant returns (address[]) {
    return contracts[msg.sender];
  }
}
