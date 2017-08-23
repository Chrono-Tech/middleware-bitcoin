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
        BITCOIN_HOST: 'localhost',
        BITCOIN_PORT: 8332,
        BITCOIN_USER: 'user',
        BITCOIN_PASS: 123
      }
    },
    {
      name: 'balance_processor',
      script: 'core/balanceProcessor',
      env: {
        MONGO_URI: 'mongodb://localhost:27017/data',
        RABBIT_URI: 'amqp://localhost:5672',
        BITCOIN_HOST: 'localhost',
        BITCOIN_PORT: 8332,
        BITCOIN_USER: 'user',
        BITCOIN_PASS: 123
      }
    },
    {
      name: 'rest',
      script: 'core/rest',
      env: {
        MONGO_URI: 'mongodb://localhost:27017/data',
        REST_PORT: 8082,
        BITCOIN_HOST: 'localhost',
        BITCOIN_PORT: 8332,
        BITCOIN_USER: 'user',
        BITCOIN_PASS: 123
      }
    }
  ]
};
