pragma solidity 0.4.18;
import './SafeMath.sol';

contract Servesa {
  using SafeMath for uint256;

  uint public version = 0;

  struct Funder {
    bool exists;
    uint tokenCount;
    uint totalPurchasePrice;
  }

  mapping(address => Funder) public funders;

  bool public live = true; // For sunsetting contract
  uint public contractStartTime;
  uint public sunsetWithdrawDate;
  uint public sunsetWithdrawalPeriod;

  uint public totalCurrentTokens = 0;
  uint public totalCurrentFunders = 0;

  address owner;
  string public contractName;
  string public contractAvatarUrl;
  bool public ownerCanBurn = false;
  bool public ownerCanSpend = false;
  uint public maxTokens = 1000;
  uint public tokenBasePrice = 100000000000000;
  uint public tokenPriceExponent = 1;
  uint public tokenPriceExponentDivisor = 10000;
  uint public tokenPriceLinearDivisor = 1000;

  event NewContract(address ownerAddress, string contractName);
  event Buy(address indexed funder, uint tokenCount);
  event Sell(address indexed funder, uint tokenCount);
  event Burn(address indexed funder, uint tokenCount);
  event Drain(uint amount);
  event Sunset(bool hasSunset);
  event FallbackEvent(address sender, uint amount);

  function Servesa (
    address ownerAddress,
    string contractNameInit,
    string contractAvatarUrlInit,
    bool ownerCanBurnInit,
    bool ownerCanSpendInit,
    uint maxTokensInit,
    uint tokenBasePriceInit,
    uint tokenPriceExponentDivisorInit,
    uint tokenPriceLinearDivisorInit,
    uint sunsetWithdrawPeriodInit) public {

    owner = ownerAddress;
    contractName = contractNameInit;
    contractAvatarUrl = contractAvatarUrlInit;
    ownerCanBurn = ownerCanBurnInit;
    ownerCanSpend = ownerCanSpendInit;
    maxTokens = maxTokensInit;

    tokenBasePrice = tokenBasePriceInit;
    tokenPriceExponentDivisor = tokenPriceExponentDivisorInit;
    tokenPriceLinearDivisor = tokenPriceLinearDivisorInit;

    sunsetWithdrawalPeriod = sunsetWithdrawPeriodInit;
    contractStartTime = now;

    NewContract(owner, contractName);
  }

  // Modifiers

  // Lifecycle
  modifier onlyWhenLive() {
    require(live);
    _;
  }
  modifier onlyWhenSunset() {
    require(!live);
    _;
  }

  // Auth
  modifier onlyByOwner() {
    require(msg.sender == owner);
    _;
  }
  modifier onlyByFunder() {
    require(isFunder(msg.sender));
    _;
  }

  // Contract options
  modifier canBurn() {
    require(ownerCanBurn);
    _;
  }
  modifier canSpend() {
    require(ownerCanSpend);
    _;
  }
  modifier belowMaxTokens() {
    require(totalCurrentTokens < maxTokens);
    _;
  }

  /*
  * External accounts can pay directly to contract - bonus!
  */
  function () payable public {
    FallbackEvent(msg.sender, msg.value);
  }

  /*
  * Buy: exchange ETH for tokens
  */
  function buy() public payable onlyWhenLive {

    // validate that enought value was sent
    require(msg.value > 0);

    // get token price
    uint nextTokenPrice = calculateNextBuyPrice();

    // validate that enought value was sent for at least one token
    require(msg.value > nextTokenPrice);

    // loop through calc purchase
    uint totalCost = 0;
    uint tokensToPurchase = 0;
    while (totalCost.add(nextTokenPrice) < msg.value && totalCurrentTokens.add(tokensToPurchase) <= maxTokens){

        // increase totalCost & tokensToPurchase
        totalCost = totalCost.add(nextTokenPrice);
        tokensToPurchase = tokensToPurchase.add(1);

        // update nextTokenPrice
        nextTokenPrice = calculateNextBuyPrice();
    }

    // check that sender sent enough value to purchase at least one token
    require(tokensToPurchase > 0);

    // Update funders array
    if(!isFunder(msg.sender)) {

    //   add to funder map
      funders[msg.sender] = Funder({
        exists: true,
        tokenCount: tokensToPurchase,
        totalPurchasePrice: totalCost
      });

       // Increase total funder count
      totalCurrentFunders = totalCurrentFunders.add(1);
    }
    else {
      funders[msg.sender].tokenCount = funders[msg.sender].tokenCount.add(tokensToPurchase);
      funders[msg.sender].totalPurchasePrice = funders[msg.sender].totalPurchasePrice.add(totalCost);
    }

    // increment total token count
    totalCurrentTokens = totalCurrentTokens.add(tokensToPurchase);

    // refund overage
    if(msg.value.sub(totalCost) > 0){
        msg.sender.transfer(msg.value.sub(totalCost));
    }

    // event
    Buy(msg.sender, funders[msg.sender].tokenCount);
  }

  /*
  * Sell: exchange tokens for ETH
  */
  function sell(uint tokenCount) public onlyWhenLive onlyByFunder {

    uint amount = calculateNextSellPrice();

    // decrease seller's token count
    funders[msg.sender].tokenCount = funders[msg.sender].tokenCount.sub(tokenCount);

    // remove founder if count == 0
    if(funders[msg.sender].tokenCount == 0){
        delete funders[msg.sender];
        totalCurrentFunders = totalCurrentFunders.sub(1);
    }

    // decrement token count
    totalCurrentTokens = totalCurrentTokens.sub(tokenCount);

    // Interaction
    msg.sender.transfer(amount.mul(tokenCount));

    // event
    Sell(msg.sender, funders[msg.sender].tokenCount);
  }

  /*
  * Burn: delete tokens without affecting escrow balance
  */
  function burn(address burnAddress, uint tokenCount) public onlyWhenLive onlyByOwner canBurn {

    // addr must be funder
    require(isFunder(burnAddress));

    // decrease targets's token count
    funders[burnAddress].tokenCount = funders[burnAddress].tokenCount.sub(tokenCount);

    // remove target if count == 0
    if(funders[burnAddress].tokenCount == 0){
        delete funders[burnAddress];
        totalCurrentFunders = totalCurrentFunders.sub(1);
    }

    // decrement token count
    totalCurrentTokens = totalCurrentTokens.sub(tokenCount);

    // event
    Burn(burnAddress, tokenCount);
  }

  /*
  * Spend: remove balance
  */
  function spend(uint amount) public onlyWhenLive onlyByOwner canSpend {

    // send amount from contract to owner
    msg.sender.transfer(amount);

    // event
    Drain(amount);
  }

    // via: http://ethereum.stackexchange.com/questions/10425/is-there-any-efficient-way-to-compute-the-exponentiation-of-a-fraction-and-an-in/10432#10432
    // Computes `k * (1+1/q) ^ N`, with precision `p`. The higher
    // the precision, the higher the gas cost. It should be
    // something around the log of `n`. When `p == n`, the
    // precision is absolute (sans possible integer overflows).
    // Much smaller values are sufficient to get a great approximation.
    function fracExp(uint k, uint q, uint n, uint p) internal pure returns (uint) {
      uint s = 0;
      uint N = 1;
      uint B = 1;
      for (uint i = 0; i < p; ++i){
        s += k * N / B / (q**i);
        N  = N * (n-i);
        B  = B * (i+1);
      }
      return s;
    }

  /*
  * use pricing function to determine next share's 'buy' price
  */
  function calculateNextBuyPrice() public view returns (uint){

    if(tokenPriceExponent == 1){
        return tokenBasePrice;
    } else {
        return fracExp(tokenBasePrice, tokenPriceExponentDivisor, totalCurrentTokens, 2).add(tokenBasePrice.mul(totalCurrentTokens.div(tokenPriceLinearDivisor)));
    }
  }

  /*
  * use pricing function to determine the current share 'sell' price
  */
  function calculateNextSellPrice() public view returns (uint){
    if(totalCurrentTokens == 0){
        return 0;
    } else {
        return SafeMath.div(this.balance, totalCurrentTokens);
    }
  }

  // Getter functions
  function getOwner() public view returns (address) {
    return owner;
  }

  function getCurrentTotalFunders() public constant returns (uint) {
    return totalCurrentFunders;
  }

  function getContractBalance() public constant returns (uint256 balance) {
    balance = this.balance;
  }

  function isFunder(address addr) public constant returns (bool) {
    return funders[addr].exists;
  }

  function getFunderTokens(address addr) public constant returns (uint256) {
    return funders[addr].tokenCount;
  }

  function getFunderPurchase(address addr) public constant returns (uint256) {
    return funders[addr].totalPurchasePrice;
  }

}
