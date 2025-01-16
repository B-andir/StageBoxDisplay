const { ipcRenderer } = require('electron');

// const draggable = document.getElementById('draggable');
const connectButton = document.getElementById('connect-button').addEventListener('click', (event) => {
  ipcRenderer.send('tcpConnect');
})

const disconnectButton = document.getElementById('disconnect-button').addEventListener('click', (event) => {
  ipcRenderer.send('disconnect');
})

const faderUp = document.getElementById('fader-up-button').addEventListener('click', (event) => {
  ipcRenderer.send('moveFaderUp');
})

const faderDown = document.getElementById('fader-down-button').addEventListener('click', (event) => {
  ipcRenderer.send('moveFaderDown');
})

// draggable.addEventListener('mousedown', (event) => {
//   const shiftX = event.clientX - draggable.getBoundingClientRect().left;
//   const shiftY = event.clientY - draggable.getBoundingClientRect().top;

//   const moveAt = (pageX, pageY) => {
//     draggable.style.left = pageX - shiftX + 'px';
//     draggable.style.top = pageY - shiftY + 'px';
//   };

//   const onMouseMove = (event) => {
//     moveAt(event.pageX, event.pageY);
//   };

//   document.addEventListener('mousemove', onMouseMove);

//   draggable.onmouseup = () => {
//     document.removeEventListener('mousemove', onMouseMove);
//     draggable.onmouseup = null;
//   };
// });

// button.addEventListener('onclick', (event) => {
// });



// draggable.ondragstart = () => false; // Disable default dragging behavior
