const socket = io();

const startCallButton = document.getElementById('startCall');
const muteCallButton = document.getElementById('muteCall');
const endCallButton = document.getElementById('endCall');

let localStream;
let remoteStream;
let peerConnection;
const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
  ]
};

// Function to get URL parameters
function getUrlParameters() {
  const params = {};
  const parser = new URL(window.location.href);
  const query = parser.search.substring(1);
  const vars = query.split("&");
  for (let i = 0; i < vars.length; i++) {
    const pair = vars[i].split("=");
    params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
  }
  return params;
}

const { username, room } = getUrlParameters();

socket.emit('join', room);

socket.on('user joined', (id) => {
  createOffer();
});

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

startCallButton.addEventListener('click', startVideoCall);
muteCallButton.addEventListener('click', toggleMute);
endCallButton.addEventListener('click', endCall);

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
    console.log('getting local tracks');
    if (!remoteStream) {
      remoteStream = new MediaStream();
      document.getElementById('remoteVideo').srcObject = remoteStream;
    }
    remoteStream.addTrack(event.track);
  };

  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit('offer', offer, room);
}

function toggleMute() {
  if (localStream) {
    localStream.getAudioTracks()[0].enabled = !localStream.getAudioTracks()[0].enabled;
    muteCallButton.textContent = localStream.getAudioTracks()[0].enabled ? 'Mute Call' : 'Unmute Call';
  }
}

function endCall() {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      localStream = null;
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      remoteStream = null;
    }
    document.getElementById('localVideo').srcObject = null;
    document.getElementById('remoteVideo').srcObject = null;
  }
}
