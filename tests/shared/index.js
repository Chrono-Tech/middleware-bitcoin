const bcoin = require('bcoin'),
  KeyRing = bcoin.keyring;


module.exports = {
  accountA: KeyRing.fromPrivate(Buffer.from('1b6d882bf85ace87d6dc41b9267a9523db98cba8d54ed55d7262800665712d25', 'hex'), 'regtest'),
  accountB: KeyRing.fromPrivate(Buffer.from('3ca6bee324edab87f26d3eab10bf5ba11791e52dbecc137216b7b82dfc2e23b1', 'hex'), 'regtest')

};