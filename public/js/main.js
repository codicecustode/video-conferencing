

const socket = io()

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const status = document.getElementById('status');
const callBtn = document.getElementById('callBtn');
const targetSocketId = document.getElementById('targetSocketId');
const endCallBtn = document.getElementById('endCallBtn');
const socketListEle = document.getElementById('socketList');
const videoContainer = document.getElementById("videoContainer")

let localStream;
let remoteStream;
let myPC;

let localSocketId = socket.id;
let peerSocketId = null;

let isYouCaller = false

socket.on('connect', () => {
  localSocketId = socket.id;
  //mySocketId.textContent = localSocketId;
});

const addSocketIdToSidebar = (id, isYou) => {
  const li = document.createElement('li')
  li.innerHTML = isYou ? `<span>YOU</span>(${id})` : id;
  socketListEle.appendChild(li)
}

const disconnectCall = async () => {
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop())
    localStream = null;
  }

  if (myPC) {
    myPC.close();
    myPC = null;
  }

  remoteVideo.srcObject = null;
  localVideo.srcObject = null;
}

const createPeerConnection = async () => {
  if (myPC) {
    return myPC
  }

  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:34.61.244.182:3478?transport=udp',
        username: 'testuser',
        credential: 'testpass'
      }
    ]
  };
  myPC = new RTCPeerConnection(configuration);

  myPC.ontrack = (event) => {

    console.log("📹 Received remote track:", event.streams);
    if (remoteVideo.srcObject !== event.streams[0]) {
      remoteVideo.srcObject = event.streams[0];
      remoteVideo.onloadedmetadata = async () => {
        await remoteVideo.play()
      };
    }
  }


  try {
    //Ask for camera access
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })

    localVideo.srcObject = localStream
    localVideo.play()

    localStream.getTracks().forEach((track) => {
      myPC.addTrack(track, localStream);
    });
  } catch (err) {
    console.error("Media access failed:", err);

    if (err.name === 'NotAllowedError') {
      alert("⚠️ Camera and microphone access was denied. Please allow permissions and try again.");
    } else if (err.name === 'NotFoundError') {
      alert("❌ No camera or microphone found on this device.");
    } else if (err.name === 'NotReadableError') {
      alert("🛑 Camera/mic is already in use by another app.");
    } else {
      alert("🚫 Unable to access camera/mic. Please check your settings and try again.");
    }
  }

  myPC.onconnectionstatechange = (event) => {
    console.log("here is the connection state ---->", myPC.connectionState);
    if (myPC.connectionState === "connected") {
      console.log("adding the class");
      videoContainer.classList.add('call-active');
    }
  };

  myPC.oniceconnectionstatechange = (ev) => {
    console.log("ICE Connection State changed to:", myPC.iceConnectionState)
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
  return myPC
}


const makeOffer = async () => {
  console.log("creating offer")
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



socket.on('socket-list', (socketIds) => {
  console.log('Received socket list:', socketIds);
  socketListEle.innerHTML = ''
  socketIds.forEach((id) => {
    addSocketIdToSidebar(id, id === socket.id)
  })
})

socket.on('hang-up', (data) => {
  endCallBtn.style.display = 'none';
  callBtn.style.display = 'inline-block'
  alert(data.msg)
})



callBtn.addEventListener('click', async () => {
  isYouCaller = true;
  peerSocketId = targetSocketId.value
  endCallBtn.style.display = 'inline-block'
  callBtn.style.display = 'none'
  makeOffer()
})

endCallBtn.addEventListener('click', async () => {
  endCallBtn.style.display = 'none';
  callBtn.style.display = 'inline-block'
  disconnectCall();
  //notify the other end that call has beed disconnected
  socket.emit('hang-up', {
    from: localSocketId,
    to: peerSocketId
  })

})



