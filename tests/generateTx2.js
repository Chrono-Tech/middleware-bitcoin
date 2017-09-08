const bcoin = require('bcoin'),
  KeyRing = bcoin.keyring;


const key = KeyRing.generate(null, 'regtest');

let privKey = key.getPrivateKey('hex');

console.log(privKey)
let restore = KeyRing.fromPrivate(Buffer.from(privKey, 'hex'), 'regtest');

console.log(restore);

