# middleware-bitcoin [![Build Status](https://travis-ci.org/ChronoBank/middleware-bitcoin.svg?branch=master)](https://travis-ci.org/ChronoBank/middleware-bitcoin)

Middleware service for which expose rest api

# Middleware-bitcoin

Middleware services for chronobank (bitcoin version)

Features:
  - ipc interface for communication with bitcoin node
  - balance changes watcher
  - rest service for manipulating with addresses and transactions

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
There are 2 possible scenarious of running the middleware modules:

##### via .env

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
BITCOIN_IPC_PATH=/tmp/
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
| BITCOIN_IPC_PATH   | bitcoin's ipc interface name

In this case, you should run the processes from the root folder, like that:
```
node core/blockProcessor
```

##### via ecosystem.config.js

If you want to run a cluster, then you need to install pm2 manager first:
```
npm install -g pm2
```

And edit the ecosystem.config.js according your needs:
```
module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps: [
    {
      name: 'block_processor',
      script: 'core/blockProcessor',
      env: {
        MONGO_URI: 'mongodb://localhost:27017/data',
        RABBIT_URI: 'amqp://localhost:5672',
        BITCOIN_NETWORK: 'regtest',
        BITCOIN_DB: 'memory',
        BITCOIN_IPC: 'bitcoin',
        BITCOIN_IPC_PATH: '/tmp/',
        BITCOIN_ETHERBASE: 'RXjwE6pvdFoR9m81KZKZVotZpn4j1SLrvH'
      }
    },
    {
      name: 'balance_processor',
      script: 'core/balanceProcessor',
      env: {
        MONGO_URI: 'mongodb://localhost:27017/data',
        RABBIT_URI: 'amqp://localhost:5672',
        BITCOIN_IPC: 'bitcoin',
        BITCOIN_IPC_PATH: '/tmp/',
      }
    },
    {
      name: 'rest',
      script: 'core/rest',
      env: {
        MONGO_URI: 'mongodb://localhost:27017/data',
        REST_PORT: 8081,
        BITCOIN_IPC: 'bitcoin',
        BITCOIN_IPC_PATH: '/tmp/'
      }
    }
  ]
};
```

Options are the same, as in .env. The only difference, is that they are specified for each app in a separate way.
Modules, which you don't want to run - you can remove or comment.

After all is done, just start cluster with:
```
pm2 start ecosystem.config.js
```

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
'bitcoin_balance.${your_account_address}'.

Here is an example of balance event object:

```
{
  "balances": {
    "confirmations0": 741382297,
    "confirmations3": 631382297,
    "confirmations6": 631382297
  },
  "tx": {
    "hash": "8156be88b476bbe2ffed08553d71ffed1c361c541b4544b4ac12d660cdc821c8",
    "witnessHash": "063f9326c09d9cf985402ab686fa8777b1fc0ac4dba9fe1919e3903516ac0f32",
    "fee": 100000,
    "mtime": 1506678521,
    "version": 1,
    "inputs": [
      {
        "value": 1203332922,
        "script": "a9143cad63978c9c3f9b282d9cfdc4d0594292b357e987",
        "address": "2Mxn4F5J7UJWUU5UWq47s3PHMqFx9JrVwzh"
      }
    ],
    "outputs": [
      {
        "value": 110000000,
        "script": "76a914f017c0fc3e1332e8e7dc8eaf23af40ae2a33823788ac",
        "address": "n3QSvYFjS6q5gfxq7hEk8qp2y3LuH1nLnA"
      },
      {
        "value": 1093232922,
        "script": "a914ce4b7f2fbf375235c6ea5bee748616115fcc304387",
        "address": "2NC41dQrsn2GnqeQ9tuZtktj4LXy7EmQJ64"
      }
    ],
    "locktime": 0,
    "hex": "01000000000101745b7cef36455be6b2143bf2def1b3c333831826a8117f7c123d553ae133433e01000000171600141327bee97b04dced8a7b7c160b9ea10f9cf81068ffffffff0280778e06000000001976a914f017c0fc3e1332e8e7dc8eaf23af40ae2a33823788ac1a6929410000000017a914ce4b7f2fbf375235c6ea5bee748616115fcc30438702483045022100855a107e05248baf7bd79f14b46b4d18505a0b09868a94153fc897b02e1863930220397ec1b1d6d52e7157a398816d1c47952725c04994e081b7e1fa509c9f18a17d0121032d22897f98617ca8cd034e1e976830918e2bd299cbb5a66be00040b92e84403e00000000",
    "valueIn": 1203332922,
    "valueOut": 1203232922
  }
}
```

### Testing
Right now, only integration tests are provided. Thus should check the core funtions only.

In order to run them, type:
```sh
npm run test
```


License
----

MIT