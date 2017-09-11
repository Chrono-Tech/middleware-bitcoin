# Middleware-bitcoin

Middleware services for chronobank (bitcoin version)

Features:
  - Keep transactions of registered users
  - microservice based architecture

### Installation

1) Clone the repo
2) run:
```
npm install -g pm2
npm install
```
2) if you need REST service, then run:
```
cd core/rest && npm install
```

### Configure
To apply your configuration, create a .env file in root folder of repo (in case it's not present already).
Below is the expamle configuration:

```
MONGO_URI=mongodb://localhost:32772/data
REST_PORT=8082
RABBIT_URI=amqp://localhost:32769
BITCOIN_NETWORK=regtest
BITCOIN_DB=leveldb
BITCOIN_DB_PATH=./db
BITCOIN_IPC=bitcoin
BITCOIN_ETHERBASE=RXjwE6pvdFoR9m81KZKZVotZpn4j1SLrvH
```

The options are presented below:

| name | description|
| ------ | ------ |
| MONGO_URI   | the URI string for mongo connection
| REST_PORT   | rest plugin port
| RABBIT_URI   | rabbitmq URI connection string
| BITCOIN_NETWORK   | bitcoin's network - main, testnet or regtest
| BITCOIN_DB   | bitcoin's database - memory or leveldb
| BITCOIN_DB_PATH   | bitcoin's db path (could be ommited, in case you use memory as db)
| BITCOIN_IPC   | bitcoin's ipc interface name


### Run
Just cd to root project's dir and type:
```
pm2 start ecosystem.config.js
```

### REST API
In order to retrieve the saved records from db,
we expose them via rest api. The route system is look like so:

| route | methods | params | description |
| ------ | ------ | ------ | ------ |
| /tx/send   | POST | TX - encoded and signed tx  | broadcast a transaction to network
| /addr   | POST | address - bitcoin's address | register a new address, whose txs middleware will listen to
| /addr   | DELETE | address - bitcoin's address | deregister an address
| /{addr}/balance   | GET | | returns a balance for the specified address
| /{addr}/utxo   | GET | | returns a UTXO for the specified address

### AMQP service

For the moment, amqp is used as a transport layer for delivering data, received for notifying client about new transaction for registered client, and about balance changes.

In order to listen for new transactions, you should subscribe yourself to exchange 'events' and listen to topic 'bitcoin_transaction.${your_account_address}'.

For balance changes - the format is the same:
'bitcoin_balance.${your_account_address}'

### Testing
Right now, only integration tests are provided. Thus should check the core funtions only.

In order to run them, type:
```sh
npm run test
```


License
----

MIT