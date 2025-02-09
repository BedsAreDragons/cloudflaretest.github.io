// WebSocket connection
const socket = new WebSocket('ws://localhost:8765');

socket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    if (data.action === 'add') {
        addFlightStrip(data.strip);
    }
    if (data.action === 'update') {
        updateFlightStrip(data.strip);
    }
};

function createFlightStrip(id, flightId, details) {
    const strip = document.createElement('div');
    strip.className = 'strip';
    strip.id = id;
    strip.setAttribute('draggable', true);
    strip.innerHTML = `
        <div class="strip-header">Flight: ${flightId}</div>
        <div class="strip-details">${details}</div>
    `;
    strip.addEventListener('dragstart', (e) => onDragStart(e, strip));
    strip.addEventListener('dragover', onDragOver);
    strip.addEventListener('dragend', onDragEnd);

    return strip;
}

function addFlightStrip(flightStrip) {
    const stripElement = createFlightStrip(flightStrip.id, flightStrip.flightId, flightStrip.details);
    document.getElementById('flight-strips').appendChild(stripElement);
}

function updateFlightStrip(flightStrip) {
    const strip = document.getElementById(flightStrip.id);
    if (strip) {
        strip.querySelector('.strip-header').textContent = `Flight: ${flightStrip.flightId}`;
        strip.querySelector('.strip-details').textContent = flightStrip.details;
    }
}

// Drag-and-drop functionality
let draggedElement = null;

function onDragStart(e, strip) {
    draggedElement = strip;
    strip.classList.add('dragging');
}

function onDragOver(e) {
    e.preventDefault();
    const flightStripsContainer = document.getElementById('flight-strips');
    const afterElement = getDragAfterElement(flightStripsContainer, e.clientY);
    if (afterElement == null) {
        flightStripsContainer.appendChild(draggedElement);
    } else {
        flightStripsContainer.insertBefore(draggedElement, afterElement);
    }
}

function onDragEnd() {
    draggedElement.classList.remove('dragging');
    socket.send(JSON.stringify({ action: 'updatePosition', id: draggedElement.id }));
}

function getDragAfterElement(container, y) {
    const flightStrips = [...container.querySelectorAll('.strip:not(.dragging)')];
    return flightStrips.reduce((closest, strip) => {
        const box = strip.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: strip };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}
