

const socket = io()

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const status = document.getElementById('status');
const callBtn = document.getElementById('callBtn');
const targetSocketId = document.getElementById('targetSocketId');

let localStream;
let remoteStream;
let myPC;

const createPeerConnection = async () => {
  if (myPC) {
    return myPC
  }
  const configuration = { 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }] }
  const pc = new RTCPeerConnection(configuration);
  pc.ontrack = (event) => {

    console.log("📹 Received remote track:", event.streams);
    if (remoteVideo.srcObject !== event.streams[0]) {
      remoteVideo.srcObject = event.streams[0];
      remoteVideo.onloadedmetadata = async () => {
        await remoteVideo.play()
      };
    }
  }
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('ice-candidate', {
        from: socket.id,
        to: targetSocketId.value,
        candidate: event.candidate
      });
    }
  };
  //Ask for camera access
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })

  localVideo.srcObject = localStream
  localVideo.play()

  localStream.getTracks().forEach((track) => {
    pc.addTrack(track, localStream); 
  });

  myPC = pc

  return pc
}


const makeOffer = async () => {
  console.log("creating offer")
  //myPC = myPeerConnection
  myPC = await createPeerConnection()

  const offer = await myPC.createOffer()
  await myPC.setLocalDescription(offer)

  socket.emit('offer', {
    from: socket.id,
    to: targetSocketId.value,
    offer: offer
  });

}


socket.on('offer', async (data) => {

  myPC = await createPeerConnection()


  await myPC.setRemoteDescription(new RTCSessionDescription(data.offer))

  const answer = await myPC.createAnswer()
  await myPC.setLocalDescription(answer)

  console.log("answer is----->", answer)

  socket.emit('answer', {
    from: socket.id,
    to: data.from,
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
  console.log("calling")
  makeOffer()
})