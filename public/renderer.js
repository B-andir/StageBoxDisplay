const draggable = document.getElementById('draggable');

draggable.addEventListener('mousedown', (event) => {
  const shiftX = event.clientX - draggable.getBoundingClientRect().left;
  const shiftY = event.clientY - draggable.getBoundingClientRect().top;

  const moveAt = (pageX, pageY) => {
    draggable.style.left = pageX - shiftX + 'px';
    draggable.style.top = pageY - shiftY + 'px';
  };

  const onMouseMove = (event) => {
    moveAt(event.pageX, event.pageY);
  };

  document.addEventListener('mousemove', onMouseMove);

  draggable.onmouseup = () => {
    document.removeEventListener('mousemove', onMouseMove);
    draggable.onmouseup = null;
  };
});

draggable.ondragstart = () => false; // Disable default dragging behavior
