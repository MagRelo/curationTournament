# Curation Tournaments

## Steps
1. Create a tournament contract with participant whitelist
2. Participants deposit their stake into the tournament contract
3. Participants assemble in the tournament lobby, and sign transaction to "login". The lobby will only allow participants that have deposited in the contract.
4. Tournament
5. Oracle commits results of the tournament to contract
6. Players withdraw deposit

## Tournament Contract
#### Public functions
- Create (whitelist, oracle)

#### Participant functions
- Deposit
- Withdraw
- VoteToDissolve

#### Oracle functions
- GetParticipants
- CommitResults
