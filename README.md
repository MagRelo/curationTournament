# Curation Tournaments

## Steps
1. Create a tournament contract with participant whitelist
2. Participants deposit their stake into the tournament contract
3. Participants assemble in the tournament lobby, and sign transaction to "login". The lobby will only allow participants that have deposited in the contract.
4. Tournament
5. Oracle commits results of the tournament to contract
6. Players withdraw their share of the pot

## Tournament Contract
#### Public functions
- Create (participant whitelist, oracle)

#### Participant functions
- Deposit
- Withdraw
- VoteToDissolve: if the participants disagree with the oracle (e.g., find a bug) they can dissolve the contract and allow each participant to withdraw their original deposit. 

#### Oracle functions
- GetParticipants: Let the oracle see who is in the tournament
- CommitResults: After the tournament the oracle will report the results.
