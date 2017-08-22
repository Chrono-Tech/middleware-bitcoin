const Promise = require('bluebird'),
  bitcoin = Promise.promisifyAll(require('bitcoin'));

let client = new bitcoin.Client({
  host: 'localhost',
  port: 8332,
  user: 'user',
  pass: 123
});
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