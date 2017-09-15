const ipc = require('node-ipc'),
  config = require('../../../config'),
  RPCBase = require('bcoin/lib/http/rpcbase');


Object.assign(ipc.config, {
  id: config.bitcoin.ipcName,
  socketRoot: config.bitcoin.ipcPath,
  retry: 1500,
  sync: true,
  silent: true,
  unlink: false
});

/**
 * @service
 * @description expose ipc RPC interface for other services
 * @param node - bitcoin node's instance
 * @returns {Promise.<*>}
 */


const init = async node => {

  node.rpc.add('gettxbyaddress', node.getTXByAddress.bind(node));
  node.rpc.add('getcoinsbyaddress', node.getCoinsByAddress.bind(node));
  node.rpc.add('getmetabyaddress', node.getMetaByAddress.bind(node));

  ipc.serve(() => {
    ipc.server.on('message', async (data, socket) => {
      try {
        data = JSON.parse(data);
        const json = await node.rpc.execute(data);

        ipc.server.emit(socket, 'message', {result: json, id: data.id});
      } catch (e) {
        ipc.server.emit(socket, 'message', {
          result: null,
          error: {
            message: 'Invalid request.',
            code: RPCBase.errors.INVALID_REQUEST
          }
        }
        );
      }

    }
    );
  }
  );

  ipc.server.start();
};

module.exports = init;
