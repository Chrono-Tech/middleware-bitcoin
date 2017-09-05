const blockModel = require('../../models/blockModel'),
  _ = require('lodash'),
  Promise = require('bluebird');

module.exports = (client) => {
  let chain = Promise.resolve();
  return new Promise(res => {
    let check = () => {
      client.getBlockCountAsync()
        .then(result => {
          chain = chain.delay(10000).then(() =>
            blockModel.findOne()
              .then(block => {
                _.get(block, 'block', 0) > result - 10 ?
                  res() : check()
              })
          )
        })
    };
    check();
  })
};