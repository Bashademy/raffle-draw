const socket = io();
const resultDiv = document.getElementById('result');

socket.on('drawResult', (data) => {
    resultDiv.textContent = `Winner: ${data.winner}`;
});
