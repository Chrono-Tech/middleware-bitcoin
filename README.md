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
BITCOIN_HOST=localhost
BITCOIN_PORT=8332
BITCOIN_USER=user
BITCOIN_PASS=123
```

The options are presented below:

| name | description|
| ------ | ------ |
| MONGO_URI   | the URI string for mongo connection
| REST_PORT   | rest plugin port
| RABBIT_URI   | rabbitmq URI connection string
| BITCOIN_HOST   | bitcoin's node host address
| BITCOIN_PORT   | bitcoin's node port address
| BITCOIN_USER   | bitcoin's node username for auth (via rpc)
| BITCOIN_PASS   | bitcoin's node pass for auth (via rpc)


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
| /transactions   | GET |  | returns an transaction's collection
| /account   | POST | account - bitcoin's account | register a new account, whose txs middleware will listen to and save

#### REST guery language

Every collection could be fetched with an additional query. The api use [query-to-mongo-and-back](https://github.com/ega-forever/query-to-mongo-and-back) plugin as a backbone layer between GET request queries and mongo's. For instance, if we want to fetch all recods from transaction's collection, where txid is  a699fd1e28493ce7cd3a9a64d98231c8abe613d00179ee6c44e36b214504b9aa, then we will make a call like that:
```
curl http://localhost:8082/transactions?format.txid="a699fd1e28493ce7cd3a9a64d98231c8abe613d00179ee6c44e36b214504b9aa"
```

For more information about queries, please refer to [query-to-mongo-and-back](https://github.com/ega-forever/query-to-mongo-and-back).

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