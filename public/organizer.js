const socket = io();

const ticketInput = document.getElementById('ticketInput');
const addButton = document.getElementById('addButton');
const startButton = document.getElementById('startButton');
const resultDiv = document.getElementById('result');
const ticketListDiv = document.getElementById('ticketList');
const csvInput = document.getElementById('csvInput');
const uploadButton = document.getElementById('uploadButton');
const rangeStart = document.getElementById('rangeStart');
const rangeEnd = document.getElementById('rangeEnd');
const addRangeButton = document.getElementById('addRangeButton');

let tickets = [];

addButton.addEventListener('click', async () => {
    const ticket = ticketInput.value.trim();
    if (ticket && !tickets.includes(ticket)) {
        tickets.push(ticket);
        ticketInput.value = '';
        await fetch('/tickets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ number: ticket })
        });
        updateTicketList();
    }
});

uploadButton.addEventListener('click', () => {
    const file = csvInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target.result;
            const rows = text.split('\n');
            for (let row of rows) {
                const ticket = row.trim();
                if (ticket && !tickets.includes(ticket)) {
                    tickets.push(ticket);
                    await fetch('/tickets', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ number: ticket })
                    });
                }
            }
            updateTicketList();
        };
        reader.readAsText(file);
    }
});

addRangeButton.addEventListener('click', async () => {
    const start = parseInt(rangeStart.value);
    const end = parseInt(rangeEnd.value);
    if (!isNaN(start) && !isNaN(end) && start <= end) {
        for (let i = start; i <= end; i++) {
            if (!tickets.includes(i.toString())) {
                tickets.push(i.toString());
                await fetch('/tickets', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ number: i.toString() })
                });
            }
        }
        rangeStart.value = '';
        rangeEnd.value = '';
        updateTicketList();
    }
});

startButton.addEventListener('click', () => {
    if (tickets.length > 0) {
        socket.emit('startDraw', tickets);
    } else {
        alert('No tickets to draw from!');
    }
});

socket.on('drawResult', async (data) => {
    resultDiv.textContent = `Winner: ${data.winner}`;
    tickets = tickets.filter(ticket => ticket !== data.winner);
    await fetch(`/tickets/${data.winner}`, {
        method: 'DELETE'
    });
    updateTicketList();
});

async function updateTicketList() {
    ticketListDiv.innerHTML = '';
    tickets.forEach(ticket => {
        const ticketDiv = document.createElement('div');
        ticketDiv.className = 'ticket';
        ticketDiv.textContent = ticket;
        ticketDiv.addEventListener('click', async () => {
            tickets = tickets.filter(t => t !== ticket);
            await fetch(`/tickets/${ticket}`, {
                method: 'DELETE'
            });
            updateTicketList();
        });
        ticketListDiv.appendChild(ticketDiv);
    });
}

// Fetch tickets from database on load
async function loadTickets() {
    const response = await fetch('/tickets');
    const data = await response.json();
    tickets = data.map(ticket => ticket.number);
    updateTicketList();
}

loadTickets();
