const { app, BrowserWindow, net } = require('electron');
const path = require('path');
const network = require('./src/TCPnetwork');
const udpnetwork = require('./src/UDPnetwork');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'public/renderer.js'),
        },
    });

    mainWindow.loadFile('public/index.html');
}

app.whenReady().then(() => {
    createWindow();

    // try {
    //     await network.connect(51326, '192.168.10.100');
    // } catch(error) {
    //     console.error('Failed to connect: ', error);
    //     app.quit();
    //     return;
    // }

    // udpnetwork.whois();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    network.disconnect();
    if (process.platform !== 'darwin') app.quit();
});