const { app, BrowserWindow, net, ipcMain } = require('electron');
const path = require('path');
const tcpNetwork = require('./src/TCPnetwork');
const udpNetwork = require('./src/UDPnetwork');
const sqFind = require('./src/FindMixers/SQFindUDP');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true, // Enable Node.js integration in the renderer process
            contextIsolation: false, // For simplicity, not recommended for production
            preload: path.join(__dirname, 'public/renderer.js'),
        },
    });

    mainWindow.loadFile('public/index.html');
}

app.whenReady().then(() => {
    createWindow();
    sqFind.startSearch();

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

    ipcMain.on('tcpConnect', async () => {
        console.log('main.js tcpConnect ipcMain');
        await tcpNetwork.connect(51326, '192.168.10.110');
        sqFind.stopSearch();
    });

    ipcMain.on('moveFaderUp', async () => {
        await tcpNetwork.sendHexData('f707070b0120ff7f');
    });

    ipcMain.on('moveFaderDown', async () => {
        await tcpNetwork.sendHexData('f707070b01200000');
    });

    ipcMain.on('test', async () => {
        await tcpNetwork.testFunctino();
    })

    ipcMain.on('disconnect', async () => {
        console.log('main.js disconnect ipcMain');
        await tcpNetwork.disconnect();
        sqFind.startSearch();
    });
});

app.on('window-all-closed', () => {
    tcpNetwork.disconnect();
    app.quit();
    // if (process.platform !== 'darwin') app.quit(); // This is for following Mac standards. But I don't like it.
});