const dgram = require('node:dgram');
const { Buffer } = require('node:buffer');
const fs = require('fs');
const path = require('path');

class UdpNetworkClient {
    constructor() {
        this.socket = dgram.createSocket('udp4');

        // Initialization of Event Listeners
        (() => {
            this.socket.on('listening', () => {
                this.socket.on('message', (message, rinfo) => {
                    // console.log('UDP Data Received: ', message);
                });
            });
        })();

        this.socket.bind('49418', '192.168.10.2')
    }

    sendData(data) {
        if (this.socket) {
            this.socket.send(data, 0, data.length, 51324, '192.168.10.110', (error, bytes) => {
                if (error) console.log('Error: ', error);
                // console.log('Sent: ', data);
            });
        } else {
            console.log('Client is not connected');
        }
    }
    
}

const UDPNETWORKCLIENT = new UdpNetworkClient();

module.exports = UDPNETWORKCLIENT;