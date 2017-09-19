const require_all = require('require-all'),
  _ = require('lodash'),
  networks = require_all({
    dirname: __dirname,
    filter: /(.+Network)\.js$/,
    recursive: true
  });

module.exports = net => {
  _.chain(networks)
    .values()
    .forEach(network => {
      net.types.push(network.type);
      net[network.type] = network;
    })
    .value();
};
