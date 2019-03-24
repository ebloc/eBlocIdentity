# eBlocIdentity

## Web Application

Academic people can sign up with their Ethereum addresses and academic emails or [ORCID](https://orcid.org)s. System validates their Ethereum addresses and academic emails, authenticates their ORCIDs and sends an email with a link that contains a verification token to their email addresses. When they click on that link, they are recorded on the blockchain (members in Root Smart Contract). Then they can sign in with their Ethereum addresses and academic emails or ORCIDs to browse and interact with the system.

## Smart Contracts

System has an N-ary tree structure. This tree represents hierarchies of communities. Each node represents a community. Root node of this tree is Root Smart Contract and all the other nodes are Group Smart Contract. Each node has

* **Name**: Name of the community.
* **Parent**: Creator node, connected node in the upper level.
* **Subgroups**: Created nodes, connected nodes in the lower level.
* **Subgroup requests**: Request to create a subgroup with specified name and be its owner.
* **Owners**: Store Ethereum addresses. They can do everything that members can do and also
  * Add and remove subgroups
  * View, accept and reject subgroup requests
  * Add and view owners
  * Vote and withdraw vote to remove owners
  * Add and remove members
  * View, accept and reject member requests
* **Members**: Store roles and Ethereum addresses. They can
  * Check and view subgroups
  * Add and check subgroup requests
  * Check owners
  * Check and view members
  * Add and check member requests
* **Member requests**: Request to be a member.


## Installation

```
$ docker-compose build
```

## Usage

```
$ docker-compose up
```
Starts MongoDB and a test blockchain with ganache-cli, deploys contracts to there and run tests with Truffle and also starts the server with nodemon.

### Example .env

```
PORT=8080
EXPRESS_SESSION_SECRET=
SENDER_EMAIL_ADDRESS=
ENCRYPTION_ALGORITHM=aes-256-cbc
ENCRYPTION_KEY=
ORCID_CLIENT_ID=
ORCID_CLIENT_SECRET=
MJ_APIKEY_PUBLIC=
MJ_APIKEY_PRIVATE=
ROOT_CONTRACT_ADDRESS=
ROOT_CONTRACT_OWNER_ADDRESS=
ETHEREUM_NETWORK_ADDRESS=http://ganache:8545
MONGODB_ADDRESS=mongodb://mongodb:27017/identity
EXPRESS_ADDRESS=http://127.0.0.1:8080
```

### How to use ganache-cli accounts

In the output of `truffle migrate` command in docker-compose, in `Deploying 'Root'` section, copy `contract address` to `ROOT_CONTRACT_ADDRESS` in `.env` and copy `account` to `ROOT_CONTRACT_OWNER_ADDRESS` in `.env`. Then you need to trigger a restart for `nodemon` by making a dummy change in `.js` files. Also you can import the owner account to your wallet (Metamask) by using the first private key in `ganache-cli` output in docker-compose.

### How to use another blockchain

In docker-compose.yml, replace `ganache` service with your client (Geth) and also set `ETHEREUM_NETWORK_ADDRESS` in `.env` according to this client. After deploying the contracts, change `ROOT_CONTRACT_ADDRESS` and `ROOT_CONTRACT_OWNER_ADDRESS` in `.env` (repeat the first step in the previous section).
