const socket = io();

const messages = document.getElementById('messages');
const input = document.getElementById('input');
const chatForm = document.getElementById('chat-form');

let localStream;
let remoteStream;
let peerConnection;
const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
  ]
};

let username = prompt('Enter your username:');
let room = 'wealthfy';

chatForm.addEventListener('submit', function (event) {
  event.preventDefault();
  sendMessage();
});

socket.emit('join', room);

socket.on('user joined', (id) => {
  createOffer();
});

socket.on('offer', async (offer, id) => {
  if (!peerConnection) {
    await createAnswer(offer);
  }
});

socket.on('answer', (answer) => {
  peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on('candidate', (candidate) => {
  peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

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
  addMessage(msg, 'bot');
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

async function startVideoCall() {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  document.getElementById('localVideo').srcObject = localStream;

  peerConnection = new RTCPeerConnection(configuration);

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('candidate', event.candidate, room);
    }
  };

  peerConnection.ontrack = (event) => {
    if (!remoteStream) {
      remoteStream = new MediaStream();
      document.getElementById('remoteVideo').srcObject = remoteStream;
    }
    remoteStream.addTrack(event.track);
  };

  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });
}

async function createOffer() {
  await startVideoCall();
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit('offer', offer, room);
}

async function createAnswer(offer) {
  await startVideoCall();
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit('answer', answer, room);
}
