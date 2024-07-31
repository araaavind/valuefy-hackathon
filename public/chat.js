const socket = io();

const messages = document.getElementById('messages');
const input = document.getElementById('input');
const chatForm = document.getElementById('chat-form');
const callButton = document.getElementById('callButton');

let username;
let room = 'wealthfy';
let messageBox;

init();

function init() {
  if (!messageBox) {
    messageBox = JSON.parse(window.localStorage.getItem('messages')) ?? [];
  }
  if (!username) {
    username = window.localStorage.getItem('username');
    if (!username || username.length == 0) {
      username = prompt('Enter your username:');
      window.localStorage.setItem('username', username);
    }
  }
  messageBox.forEach((m) => {
    addMessage(m, m.system);
  });
}

chatForm.addEventListener('submit', function (event) {
  event.preventDefault();
  sendMessage();
});

socket.emit('join', room);

function sendMessage() {
  const message = input.value;
  if (message && username) {
    const fullMessage = { username: username, text: message, room: room, system: 'user' };
    socket.emit('chat message', fullMessage);
    input.value = '';
    addMessage(fullMessage, 'user');
    messageBox.push(fullMessage);
    window.localStorage.setItem('messages', JSON.stringify(messageBox))
  }
}

socket.on('chat message', function (msg) {
  if (msg.username != username) {
    addMessage(msg, 'bot');
    msg.system = 'bot';
    messageBox.push(msg);
    window.localStorage.setItem('messages', JSON.stringify(messageBox))
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

// Set the href of the call button to include the username and room
callButton.href = `/call?username=${encodeURIComponent(username)}&room=${encodeURIComponent(room)}`;
callButton.onclick = (() => {
});
