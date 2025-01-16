const net = require('net');
const udpNetwork = require('./UDPnetwork');
const fs = require('fs');
const path = require('path');
const { time } = require('console');

const dataPath = path.resolve(__dirname, '../data/SQTCPData.json');

// Synchronously read and parse the JSON file
let sqTcpData;
try {
    const rawData = fs.readFileSync(dataPath, 'utf8');
    sqTcpData = JSON.parse(rawData);
} catch (error) {
    console.error('Error reading or parsing connected_mixers.json:', error);
    sqTcpData = {}; // Fallback to an empty object or handle the error accordingly
}

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

class TcpNetworkClientOld {
    constructor() {
        this.client = null;
        this.socket = null;
        this.keepAliveInterval = null;
        this.pendingResponses = new Map(); // Track pending responses
    }

    connect(port, host) {
        console.log('connect called');
        return new Promise((resolve, reject) => {
            console.log('TCP connect');
            this.client = new net.Socket({port: 51832, address: '192.168.10.2'});
            this.socket = this.client.connect(port, host, () => {
                this.keepAliveInterval = setInterval(() => {
                    const keepAliveData = Buffer.from('7f0500000000', 'hex');
                    udpNetwork.sendData(keepAliveData);
                }, 1000);

                this.sendHexData('7f00020000000ac1')

                resolve();
            });

            this.client.on('error', (err) => {
                console.log('Connection error: ', err);
                reject(err);
            });

            this.client.on('data', (data) => {
                console.log('Received: ', data.toString('hex'));

            });

            this.client.on('close', () => {
                console.log('Connection closed');
            });

            this.sendInitializeData();
        });
    }

    async sendInitializeData() {
        const sendDataArray = sqTcpData.data;
    
        for (const hexData of sendDataArray) {
            await sleep(64); // Wait 64 ms before sending the next data
            this.sendHexData(hexData);
        }
    }

    sendData(data) {
        if (this.client) {
            this.client.write(data);
            console.log('Sent: ', data);
        } else {
            console.log('Client is not connected');
        }
    }

    sendHexData(hexData) {
        if (this.client) {
            const data = Buffer.from(hexData, 'hex');
            this.client.write(data);
            console.log('Sent: ', data);
        } else {
            console.log('Client is not connected');
        }
    }

    disconnect() {
        if (this.client) {
            this.client.destroy();
            clearInterval(this.keepAliveInterval);
            console.log('Disconnected from server');
        }
    }
}

class TcpNetworkClient {
    constructor() {
        this.client = null;
        this.socket = null;
        this.keepAliveInterval = null;
        this.pendingResponses = new Map(); // Track sent packets and their responses
        this.isInitializing = false;
        this.sessionFirstWrite = true;
    }

    connect(port, host) {
        return new Promise((resolve, reject) => {
            this.client = new net.Socket({port: 51832, address: '192.168.10.2'});

            this.socket = this.client.connect(port, host, () => {
                this.keepAliveInterval = setInterval(() => {
                    const keepAliveData = Buffer.from('7f0500000000', 'hex');
                    udpNetwork.sendData(keepAliveData);
                }, 1000);

                this.client.on('error', (err) => reject(err));
                this.client.on('data', (data) => this.handleIncomingData(data));
                this.client.on('close', () => console.log('Connection closed'));

                this.initializeData();

                resolve();
            });

        });
    }

    handleIncomingData(data) {
        if (this.isInitializing) {
            const currentTime = Date.now();

            // Find the most recent packet that has not been finalized
            for (const [id, packetData] of this.pendingResponses.entries()) {
                if (packetData.dataSent && !packetData.finalized) {
                    const hexDataString = data.toString('hex');
                    if (!packetData.responsesHasBegun && hexDataString.slice(0, 2) == "7f") {
                        packetData.responsesHasBegun = true;
                    }

                    // Append the received data to this packet's response
                    packetData.responses.push({ timestamp: currentTime, data: hexDataString});
                    packetData.fullResponse += hexDataString;

                    console.log(`Current responses: ${packetData.responses.length}\tBytes: ${packetData.fullResponse.length / 2}`)
    
                    // Simulate a "finalized" condition (e.g., based on timeouts or other criteria)
                    clearTimeout(packetData.timeout);
                    packetData.timeout = setTimeout(() => {
                        packetData.finalized = true;
                        console.log(`Response complete for packet ID: ${id}\nSend next data request in queue`);
                        if (id + 1 <= this.pendingResponses.size - 1) {
                            this.sendInitializeData(id + 1);
                        } else if (id == this.pendingResponses.size - 1) {
                            // This was the last data packet. Flag initialization as done.
                            this.isInitializing = false;
                            this.saveAllData();
                            console.log(`Initialization done!`);
                        }
                    }, 30); // Adjust timeout as needed
    
                    break;
                }
            }
        } else {
            // console.log('New Data received:');
            // console.log(data.toString('utf8'));
            // console.log(data.toString('hex'));
        }
        
    }

    async initializeData() {
        console.log('Begin Initialization')
        const dataArray = sqTcpData.data;

        for (const [index, hexData] of dataArray.entries()) {
            
            await this.pendingResponses.set(index, {
                data: hexData,
                dataSent: false,
                responses: [],
                fullResponse: "",
                responsesHasBegun: false,
                finalized: false,
                timeout: null
            })

            // this.sendHexData(hexData);

        }

        this.isInitializing = true;

        await this.sendInitializeData(0);
    }

    async sendInitializeData(index) {
        if (!this.pendingResponses) {
            console.warn(`No pending responses object!`);
            return false;
        } else if (index < 0 || index > this.pendingResponses.size - 1) {
            console.warn(`Index is outside of range. Index: ${index}, Max: ${this.pendingResponses.size - 1}`);
            return false;
        }
        // if (!this.pendingResponses || typeof(index) == "number" || index < 0 || index > this.pendingResponses.size - 1) return false;


        var pendingData = await this.pendingResponses.get(index);
        if (pendingData.dataSent) {
            console.warn(`Data of ID ${index} is already sent!`)
            return false
        } else {
            pendingData.dataSent = true;
            // This timeout is overwritten when data is received.
            var timeoutTime = 500; // Time in ms until this request is timed out after no responses.
            pendingData.timeout = setTimeout(() =>{
                console.warn(`No responses from ID: ${index} with data [${pendingData.data}] in ${timeoutTime} ms`)
                pendingData.finalized = true;
                if (index + 1 <= this.pendingResponses.size - 1) {
                    console.log(`Sending next data request in queue`);
                    this.sendInitializeData(index + 1)
                } else if (index == this.pendingResponses.size - 1) {
                    // This was the last data packet. Flag initialization as done.
                    this.isInitializing = false;
                    this.saveAllData();
                    console.log(`Initialization done!`);
                }
            }, timeoutTime);
            this.sendHexData(pendingData.data)
            return true;
        }
    }

    sendHexData(hexData) {
        if (this.client) {
            const data = Buffer.from(hexData, 'hex');
            this.client.write(data);
            console.log('Sent data:', data.toString('hex'));
        } else {
            console.log('Client is not connected');
        }
    }

    getExistingData() {
        const filePath = path.resolve(__dirname, '../data/collected_responses.json');
        const dataString = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(dataString);

        return jsonData;
    }

    saveAllData() {
        // Convert pendingResponses to an array or object for easy storage
        const newData = Array.from(this.pendingResponses.entries()).map(([id, packetData]) => ({
            sentData: packetData.data,
            responseEntry: {
                id,
                fullResponse: packetData.fullResponse,
                responses: packetData.responses,
            }
            
        }));

        const filePath = path.resolve(__dirname, '../data/collected_responses.json');
        let allData;

        if (this.sessionFirstWrite) {
            // Overwrite the file on the first save in the session
            allData = newData.map(item => ({
                sentData: item.sentData,
                responseHistory: [item.responseEntry],
            }));
            this.sessionFirstWrite = false;
        } else {
            // Append to existing data
            const existingData = this.getExistingData();

            // Merge new data with existing data
            allData = existingData.map(existingItem => {
                const newItem = newData.find(item => item.sentData === existingItem.sentData);
                if (newItem) {
                    // Append to responseHistory if the ID matches
                    existingItem.responseHistory.push(newItem.responseEntry);
                    return existingItem;
                }
                return existingItem;
            });

            // Add any new items not already in the existing data
            const newItems = newData
                .filter(newItem => !existingData.some(existingItem => existingItem.sentData === newItem.sentData))
                .map(item => ({
                    sentData: item.sentData,
                    responseHistory: [item.responseEntry],
                }));

            allData = allData.concat(newItems);
        }

        // Write updated data to the file
        fs.writeFileSync(filePath, JSON.stringify(allData, null, 2), 'utf8');
        console.log('All data saved to:', filePath);
    }

    disconnect() {
        if (this.client) {
            this.client.destroy();
            clearInterval(this.keepAliveInterval);
            console.log('Disconnected from server');
        }
    }

    testFunctino() {

    }
}


const TCPNETWORKCLIENT = new TcpNetworkClient();

module.exports = TCPNETWORKCLIENT;