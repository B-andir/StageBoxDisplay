const dgram = require('node:dgram');
const { Buffer } = require('node:buffer');
const fs = require('fs');
const path = require('path');

// Resolve the correct path relative to the project root
const mixersPath = path.resolve(__dirname, '../../data/connected_mixers.json');

// Synchronously read and parse the JSON file
let mixers;
try {
    const rawData = fs.readFileSync(mixersPath, 'utf8');
    mixers = JSON.parse(rawData).mixers;
} catch (error) {
    console.error('Error reading or parsing connected_mixers.json:', error);
    mixers = {}; // Fallback to an empty object or handle the error accordingly
}

let interval = null;

const broadcastSocket = dgram.createSocket('udp4');

const msg = Buffer.from('SQ Find')

function addOrUpdateObject(dataArray, newObject) {
    const existingIndex = dataArray.findIndex(item => item.IP == newObject.IP);

    if (existingIndex != -1) {
        // Update exististing data
        dataArray[existingIndex] = newObject;
    } else {
        // Add new object
        dataArray.push(newObject);
    }

    return dataArray;
}

function startSearch() {
    interval = setInterval(() => {
        broadcastSocket.send(msg, 0, msg.length, 51320, '255.255.255.255', (error, bytes) => {
            console.log('Broadcast sent');
            if (error) console.log('Error: ', error);
        });
    }, 2000);
}

function stopSearch() {
    clearInterval(interval);
}

broadcastSocket.on('listening', () => {
    console.log('started listening');
    broadcastSocket.setBroadcast(true);
    

    broadcastSocket.on('message', (message, rinfo) => {
        // console.log('Received Hex Data: ', message.toString('hex'));
        // console.log('Message Address: ', rinfo.address);
        // console.log('Message Port: ', rinfo.port);
        console.log('Found SQ mixer: ', message.toString('ascii'));

        var newMixer = {
            name: message.toString('ascii'),
            IP: rinfo.address,
            UDPport: rinfo.port
        };
        
        mixers = addOrUpdateObject(mixers, newMixer);
        const jsonData = JSON.stringify({"mixers": mixers}, null, 2);
        fs.writeFileSync(mixersPath, jsonData);
    })
});


broadcastSocket.bind('64123', '192.168.10.2');

module.exports = { startSearch, stopSearch };