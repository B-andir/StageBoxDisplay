const dgram = require('node:dgram');
const { Buffer } = require('node:buffer');

const broadcastSocket = dgram.createSocket('udp4');

const msg = Buffer.from('SQ Find')

broadcastSocket.on('listening', () => {
    console.log('started listening');
    broadcastSocket.setBroadcast(true);
    setInterval(() => {
        broadcastSocket.send(msg, 0, msg.length, 51320, '255.255.255.255', (error, bytes) => {
            console.log('Broadcast sent');
            if (error) console.log('Error: ', error);
        });
    }, 1000);

    broadcastSocket.on('message', (message, rinfo) => {
        console.log('Received Hex Data: ', message.toString('hex'));
        console.log('Message Address: ', rinfo.address);
        console.log('Message Port: ', rinfo.port);
        console.log('ASCII representation: ', message.toString('ascii'));
    })
});


broadcastSocket.bind('64123', '192.168.10.2');

module.exports = { };