const dgram = require('node:dgram');
const { Buffer } = require('node:buffer');

class UDPNetworkClient {
    constructor() {
        this.server = null;
        this.client = null;
    }

    whois() {
        const whoismessage = Buffer.from('SQ FIND')

        // this.server = dgram.createSocket('udp4');
        this.client = dgram.createSocket('udp4');
        // this.server.on('error', (err) => {
        //     console.error(`server error:\n${err.stack}`);
        //     server.close();
        // });
          
        // this.server.on('message', (msg, rinfo) => {
        //     console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
        // });

        // this.server.bind(64523)

        this.client.setBroadcast(true);

        this.client.send(whoismessage, 51320, '255.255.255.255');


        socket.on('listening', function () {
            socket.setBroadcast(true);
            setInterval(() => {
                socket.send(message, 0, message.length, 5555, '255.255.255.255');
            }, 5000);
        });
    }
}

module.exports = new UDPNetworkClient();