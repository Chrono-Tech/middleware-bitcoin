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
        BITCOIN_ETHERBASE: 'RXjwE6pvdFoR9m81KZKZVotZpn4j1SLrvH'
      }
    },
    {
      name: 'balance_processor',
      script: 'core/balanceProcessor',
      env: {
        MONGO_URI: 'mongodb://localhost:27017/data',
        RABBIT_URI: 'amqp://localhost:5672',
        BITCOIN_IPC: 'bitcoin'
      }
    },
    {
      name: 'rest',
      script: 'core/rest',
      env: {
        MONGO_URI: 'mongodb://localhost:27017/data',
        REST_PORT: 8082,
        BITCOIN_IPC: 'bitcoin'
      }
    }
  ]
};
