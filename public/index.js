const socket = io();

const messages = document.getElementById('messages');
const input = document.getElementById('input');

let username = prompt('Enter your username:');

function sendMessage() {
  const message = input.value;
  if (message && username) {
    const fullMessage = { username: username, text: message };
    socket.emit('chat message', fullMessage);
    input.value = '';
    addMessage(fullMessage, 'user');
  }
}

socket.on('chat message', function (msg) {
  console.log(msg);
  if (msg.username != username) {
    addMessage(msg, 'bot');
  }
});

function addMessage(message, sender) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message', sender);

  const contentElement = document.createElement('div');
  contentElement.classList.add('content');

  const usernameElement = document.createElement('span');
  usernameElement.classList.add('username');
  usernameElement.textContent = message.username + ': ';

  contentElement.appendChild(usernameElement);
  contentElement.appendChild(document.createTextNode(message.text));

  messageElement.appendChild(contentElement);
  messages.appendChild(messageElement);
  messages.scrollTop = messages.scrollHeight;
}
