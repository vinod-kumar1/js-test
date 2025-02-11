const WebSocket = require('ws');
const readline = require('readline');
let { v4 } = require("uuid");

// Create WebSocket server on port 8080
const wss = new WebSocket.Server({ port: 8080 });
// Connection event handler
let publicClients = [];

wss.on('connection', (ws) => {
  let clientId;

  if (publicClients.length >= 2) {
    ws.send(JSON.stringify({ type: "limit" }))
    ws.close()
    return;
  };
  //  listen to the incomming messages
  ws.on('message', (message) => {
    let msg;

    try {
      msg = JSON.parse(message); // Parse incoming message safely
    } catch (err) {
      console.error('Error parsing message:', err);
      return; // If there's an error parsing, just return
    }

    switch (msg.type) {
      case "id":
        console.log("New client connected: " + msg.id);
        clientId = v4(msg.id);
        ws.client = clientId;
        publicClients.push(clientId)
        ws.send(JSON.stringify({ type: "newClient", client: publicClients }));
        break;

      case "message":
        console.log("received a message from client", msg.client, msg.message);
        !msg.client ? console.log(ws.clientName, ':', msg.message) : sendMessageToClient(msg);
        break;

      default:
        console.log('Unknown message type:', msg.type);
    }
  });

  // Handle client disconnection
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

console.log('WebSocket server is running on ws://localhost:8080');

// Create a readline interface to accept input from the terminal
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function sendMessageToClient({ message, client }) {
  wss.clients.forEach(cl => {
    console.log(client, cl.client, "nc-l");
    if (cl.client == client) {
      cl.send(JSON.stringify({ type: "message", message: message }));
    }
  });

}

// Function to send a message from the server to all clients
function sendMessageToAllClients(message) {

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: "message", message: message }));
    }
  });
}
// Handle user input from terminal
rl.on('line', (input) => {
  sendMessageToAllClients(input); // Send the input message to all clients
});
