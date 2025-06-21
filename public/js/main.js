

const socket = io()

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const status = document.getElementById('status');
const callBtn = document.getElementById('callBtn');
const targetSocketId = document.getElementById('targetSocketId');

let localStream;
let remoteStream;
let myPC;

let localSocketId = socket.id;
let peerSocketId = null;

let isYouCaller = false

socket.on('connect', () => {
  localSocketId = socket.id;
  console.log("My socket ID:", localSocketId);
});

const createPeerConnection = async () => {
  if (myPC) {
    return myPC
  }

  const configuration = { 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }] }
  const pc = new RTCPeerConnection(configuration);
  myPC = pc
  myPC.ontrack = (event) => {

    console.log("📹 Received remote track:", event.streams);
    if (remoteVideo.srcObject !== event.streams[0]) {
      remoteVideo.srcObject = event.streams[0];
      remoteVideo.onloadedmetadata = async () => {
        await remoteVideo.play()
      };
    }
  }

  myPC.oniceconnectionstatechange = (ev) => {
    console.log("ICE Connection State changed to:", pc.iceConnectionState)
  };

  myPC.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('ice-candidate', {
        from: localSocketId,
        to: peerSocketId,
        candidate: event.candidate
      });
    }
  };
  //Ask for camera access
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })

  localVideo.srcObject = localStream
  localVideo.play()

  localStream.getTracks().forEach((track) => {
    myPC.addTrack(track, localStream);
  });
  return myPC
}


const makeOffer = async () => {
  console.log("creating offer")
  //myPC = myPeerConnection
  myPC = await createPeerConnection()

  const offer = await myPC.createOffer()
  await myPC.setLocalDescription(offer)

  socket.emit('offer', {
    from: localSocketId,
    to: peerSocketId,
    offer: offer
  });

}


socket.on('offer', async (data) => {

  myPC = await createPeerConnection()

  if (!isYouCaller) {
    peerSocketId = data.from;
  }


  await myPC.setRemoteDescription(new RTCSessionDescription(data.offer))

  const answer = await myPC.createAnswer()
  await myPC.setLocalDescription(answer)

  console.log("answer is----->", answer)

  socket.emit('answer', {
    from: localSocketId,
    to: peerSocketId,
    answer
  })

})

socket.on('answer', async (data) => {
  console.log('a', data.answer)
  if (!data.answer || !data.answer.type || !data.answer.sdp) {
    console.error("Invalid answer received:", data.answer);
    return;
  }


  await myPC.setRemoteDescription(new RTCSessionDescription(data.answer))
})

socket.on('ice-candidate', async (data) => {
  if (!data.candidate) return;

  if (!myPC) {
    console.warn("Received ICE candidate before myPC was ready. Ignoring.");
    return;
  }

  try {
    await myPC.addIceCandidate(new RTCIceCandidate(data.candidate));
    console.log("ICE candidate added");
  } catch (err) {
    console.error("Error adding ICE candidate:", err);
  }
});







callBtn.addEventListener('click', async () => {
  isYouCaller = true;
  peerSocketId = targetSocketId.value
  makeOffer()
})