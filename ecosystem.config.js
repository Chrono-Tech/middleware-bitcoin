module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps : [
    {
      name      : 'block_processor',
      script    : 'core/blockProcessor',
      env: {
        COMMON_VARIABLE: 'true'
      },
      env_production : {
        NODE_ENV: 'production'
      }
    },
    {
      name      : 'balance_processor',
      script    : 'core/balanceProcessor'
    },
    {
      name      : 'rest',
      script    : 'core/rest'
    }
  ]
};
