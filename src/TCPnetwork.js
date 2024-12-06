const net = require('net');

class NetworkClient {
    constructor() {
        this.client = null;
    }

    connect(port, host) {
        return new Promise((resolve, reject) => {
            this.client = new net.Socket();
            this.client.connect(port, host, () => {
                console.log('Connected to server!');
                resolve();
            });

            this.client.on('error', (err) => {
                console.log('Connection error: ', err);
                reject(err);
            });

            this.client.on('data', (data) => {
                console.log('Received: ', data.toString());

            });

            this.client.on('close', () => {
                console.log('Connection closed');
            });
        });
    }

    sendData(data) {
        if (this.client) {
            this.client.write(data);
            console.log('Sent: ', data);
        } else {
            console.log('Client is not connected');
        }
    }

    disconnect() {
        if (this.client) {
            this.client.destroy();
            console.log('Disconnected from server');
        }
    }
}

module.exports = new NetworkClient();