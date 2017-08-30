const ipc = require('node-ipc'),
  config = require('../config');

Object.assign(ipc.config, {
  id: config.bitcoin.ipcName,
  retry: 1500,
  silent: true
});
ipc.connectTo('bitcoin', () => {
    ipc.of.bitcoin.on('connect', () => {
        ipc.of.bitcoin.emit('message', JSON.stringify({
            method: 'gettransaction',
            params: ['88e00cd0800ceb6acdc08cc9b71a6dd4daa2f11f68a290ef1f4fbd26ec2456eb']
          })
        );
      }
    );

    ipc.of.bitcoin.on('message', data => {
        console.log(data);
      }
    );
  }
);