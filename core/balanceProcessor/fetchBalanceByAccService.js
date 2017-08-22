const Promise = require('bluebird'),
  config = require('../../config'),
  bitcoin = Promise.promisifyAll(require('bitcoin')),
  client = new bitcoin.Client(config.bitcoin);

/**
 * @service
 * @description get balances for each account
 * @param accounts - fetched accounts from mongodb
 * @returns {Promise.<[{balance, account}]>}
 */
module.exports = async accounts => {

  if (!accounts.length)
    return [];


  return await new Promise(res => {
    let answers = [];

    client.cmd(accounts.map(account => ({
      method: 'getbalance',
      params: [account.account]
    })
    ), function(err, balance) {
      answers.push({balance: balance, account: accounts[answers.length]});
      if (answers.length === accounts.length)
        res(answers);
    });
  });

};