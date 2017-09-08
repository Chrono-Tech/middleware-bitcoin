const bcoin = require('bcoin');
const KeyRing = bcoin.keyring;
const Outpoint = bcoin.outpoint;
const MTX = bcoin.mtx;

module.exports = (prevHash) => {

  const key = KeyRing.generate('regtest');
//const key2 = KeyRing.generate('regtest');

  function dummy () {
    const hash = bcoin.crypto.random.randomBytes(32).toString('hex');
    return new Outpoint(hash, 0);
  }

  const mtx = new MTX();
  mtx.addOutpoint(prevHash ? new Outpoint(prevHash, 0) : dummy());
  mtx.addOutput(key.getAddress(), Math.floor(Math.random() * 100, 2) * Math.pow(10, 8));

  return mtx.toTX();


};
