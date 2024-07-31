const socket = io();

const startCallButton = document.getElementById('startCall');
const muteCallButton = document.getElementById('muteCall');
const endCallButton = document.getElementById('endCall');

let localStream;
let peerConnection;
const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
  ]
};

// Get username and room from URL parameters
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

// Event listeners
startCallButton.addEventListener('click', startVideoCall);
muteCallButton.addEventListener('click', toggleMute);
endCallButton.addEventListener('click', endCall);

// Start the video call
async function startVideoCall() {
  // Get user media (video and audio)
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  document.getElementById('localVideo').srcObject = localStream;

  // Create peer connection
  peerConnection = new RTCPeerConnection(configuration);

  // Add local stream tracks to the peer connection
  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  // Handle remote track
  peerConnection.ontrack = (event) => {
    const remoteVideo = document.getElementById('remoteVideo');
    remoteVideo.srcObject = event.streams[0];
  };

  // Handle ICE candidates
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('candidate', event.candidate, room);
    }
  };

  // Create an offer
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit('offer', offer, room);
}

// Toggle mute/unmute
function toggleMute() {
  if (localStream) {
    const audioTrack = localStream.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
    muteCallButton.textContent = audioTrack.enabled ? 'Mute Call' : 'Unmute Call';
  }
}

// End the call
function endCall() {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }
  document.getElementById('localVideo').srcObject = null;
  document.getElementById('remoteVideo').srcObject = null;
}

// Handle incoming offer
socket.on('offer', async (offer) => {
  if (!peerConnection) {
    createPeerConnection();
  }
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit('answer', answer, room);
});

// Handle incoming answer
socket.on('answer', (answer) => {
  peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

// Handle incoming ICE candidates
socket.on('candidate', (candidate) => {
  peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

// Create peer connection for incoming call
function createPeerConnection() {
  peerConnection = new RTCPeerConnection(configuration);

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('candidate', event.candidate, room);
    }
  };

  peerConnection.ontrack = (event) => {
    document.getElementById('remoteVideo').srcObject = event.streams[0];
  };

  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });
}
