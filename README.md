# Middleware-bitcoin [![Build Status](https://travis-ci.org/ChronoBank/middleware-bitcoin.svg?branch=master)](https://travis-ci.org/ChronoBank/middleware-bitcoin)

Bitcoin Middleware service installer

### Installation

After cloning repo, do:
```
npm install
```

then just run installer with:
```
node .
```

You should see available modules to install in cli. Check modules you want to install to - and the rest of the work installer will handle.

#### Installation without CLI

If you don't have a chance to run cli - then you can just pass modules, you will to install as args:

```
node . middleware-middleware-blockprocessor middleware-bitcoin-rest
```

### Modules
The middleware consists of 3 core modules.

##### Block processor
This module is served as a full bitcoin node. The iteraction with node happens via IPC interface. In order to install this module, you should сheck 'middleware-bitcoin-blockprocessor' in cli menu during installation.

##### Balance processor
This module is used for updating balances for registered accounts (see a description of accounts in block processor serction).

In order to install it, check this option in cli:
```
middleware-bitcoin-balance-processor
```

##### Rest
Rest module is used for exposing REST API over block processor. It includes methods for fetching accounts, utxo and pushing new txs.

In order to install it, check this option in cli:
```
middleware-bitcoin-rest
```

##### Litecoin Block processor
This module is served as a full litecoin node. The iteraction with node happens via IPC interface. In order to install this module, you should сheck 'middleware-litecoin-blockprocessor' in cli menu during installation. Due the equality of rpc commands with bitcoin - balance and rest services for bitcoin are completely compatible with litecoin blockprocessor.

### Configure
There are 2 possible scenarious of running the middleware modules:

##### via .env

To apply your configuration, create a .env file in root folder of repo (in case it's not present already).
Below is the expamle configuration:

```
MONGO_URI=mongodb://localhost:27017/data
MONGO_COLLECTION_PREFIX=bitcoin
REST_PORT=8081
RABBIT_URI=amqp://localhost:5672
NETWORK=regtest
DB_DRIVER=leveldb
DB_PATH=./db
IPC_NAME=bitcoin
IPC_PATH=/tmp/
```

The options are presented below:

| name | description|
| ------ | ------ |
| MONGO_URI   | the URI string for mongo connection
| MONGO_COLLECTION_PREFIX   | the prefix name for all created collections, like for Account model - it will be called (in our case) bitcoinAccount
| REST_PORT   | rest plugin port
| RABBIT_URI   | rabbitmq URI connection string
| NETWORK   | network name (alias)- is used for connecting via ipc (regtest, main, testnet, bcc)
| DB_DRIVER   | bitcoin database driver (leveldb or memory)
| DB_PATH   | path where to store db (with memory db you can skip this option)
| IPC_NAME   | ipc file name
| IPC_PATH   | directory, where to store ipc file (you can skip this option on windows)




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
apps = [
    {
      name: 'block_processor',
      script: 'core/middleware-bitcoin-blockprocessor',
      env: {
        MONGO_URI: 'mongodb://localhost:27017/data',
        MONGO_COLLECTION_PREFIX: 'bitcoin',
        RABBIT_URI: 'amqp://localhost:5672',
        NETWORK: 'regtest',
        DB_DRIVER: 'memory',
        IPC_NAME: 'bitcoin',
        IPC_PATH: '/tmp/'
      }
    },
    {
      name: 'balance_processor',
      script: 'core/middleware-bitcoin-balance-processor',
      env: {
        MONGO_URI: 'mongodb://localhost:27017/data',
        MONGO_COLLECTION_PREFIX: 'bitcoin',
        RABBIT_URI: 'amqp://localhost:5672',
        IPC_NAME: 'bitcoin',
        IPC_PATH: '/tmp/',
      }
    },
    {
      name: 'rest',
      script: 'core/middleware-bitcoin-rest',
      env: {
        MONGO_URI: 'mongodb://localhost:27017/data',
        MONGO_COLLECTION_PREFIX: 'bitcoin',
        REST_PORT: 8081,
        IPC_NAME: 'bitcoin',
        IPC_PATH: '/tmp/'
      }
    },
    {
      name: 'block_processor',
      script: 'core/middleware-litecoin-blockprocessor',
      env: {
        MONGO_URI: 'mongodb://localhost:27017/data',
        MONGO_COLLECTION_PREFIX: 'litecoin',
        RABBIT_URI: 'amqp://localhost:5672',
        NETWORK: 'regtest',
        DB_DRIVER: 'memory',
        IPC_NAME: 'litecoin',
        IPC_PATH: '/tmp/'
      }
    }
  ];
```

Options are the same, as in .env. The only difference, is that they are specified for each app in a separate way.
Modules, which are not installed - will be ignored in configuration

After all is done, just start cluster with:
```
pm2 start ecosystem.config.js
```


License
----

MIT