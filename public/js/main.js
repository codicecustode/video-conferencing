const socket = io()

import { AudioRecorder } from './audioRecorder.js';

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const status = document.getElementById('status');
const callBtn = document.getElementById('callBtn');
const targetSocketId = document.getElementById('targetSocketId');
const endCallBtn = document.getElementById('endCallBtn');
const socketListEle = document.getElementById('socketList');
const videoContainer = document.getElementById("videoContainer");
const toggleAudio = document.getElementById("toggle-audio")
const toggleVideo = document.getElementById("toggle-video")
const recordBtn = document.getElementById("recordBtn")
const pauseBtn = document.getElementById("pauseBtn")
const resumeBtn = document.getElementById("resumeBtn")

const audIcon = document.getElementById("audio-icon");
const vidIcon = document.getElementById("video-icon");

let localStream;
let remoteStream;
let myPC;

let bigVideoFrame = null;

let localSocketId = socket.id;
let peerSocketId = null;

let isYouCaller = false;

let isAudioMuted = false;
let isVideoMuted = false;

let audioRecorder = null;

socket.on('connect', () => {
  console.log("socketID", socket.id)
  localSocketId = socket.id;
  bigVideoFrame = 'remote';
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

async function watchPermission(name, callback) {
  try {
    const permissionStatus = await navigator.permissions.query({ name });

    // Initial status
    callback(permissionStatus.state);

    // Listen for changes
    permissionStatus.onchange = () => {
      callback(permissionStatus.state);
    };
  } catch (err) {
    console.error("Permission API not supported for:", name, err);
  }
}

window.onload = async () => {
  try {

    watchPermission("camera", updateCameraIcon);

    watchPermission("microphone", (state) => {
      console.log("Mic permission:", state);
      updateMicIcon(state);
    });

    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    localVideo.srcObject = localStream
    localVideo.play()



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
}

// window.addEventListener('DOMContentLoaded', async () => {
//   try {

//     watchPermission("camera", updateCameraIcon);

//     watchPermission("microphone", (state) => {
//       console.log("Mic permission:", state);
//       updateMicIcon(state);
//     });

//     localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
//     localVideo.srcObject = localStream
//     localVideo.play()



//   } catch (err) {
//     console.error("Media access failed:", err);

//     if (err.name === 'NotAllowedError') {
//       alert("⚠️ Camera and microphone access was denied. Please allow permissions and try again.");
//     } else if (err.name === 'NotFoundError') {
//       alert("❌ No camera or microphone found on this device.");
//     } else if (err.name === 'NotReadableError') {
//       alert("🛑 Camera/mic is already in use by another app.");
//     } else {
//       alert("🚫 Unable to access camera/mic. Please check your settings and try again.");
//     }
//   }
// })

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

  localStream.getTracks().forEach((track) => {
    myPC.addTrack(track, localStream);
  });

  myPC.ontrack = (event) => {

    if (!remoteStream) {
      remoteStream = new MediaStream();
    }

    event.streams[0].getTracks().forEach(track => {
      remoteStream.addTrack(track);
    });

    console.log("📹 Received remote track:", event.streams);
    if (remoteVideo.srcObject !== event.streams[0]) {
      remoteVideo.srcObject = event.streams[0];
      remoteVideo.onloadedmetadata = async () => {
        await remoteVideo.play()
      };
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



callBtn.addEventListener('click', async (e) => {
  const inputValue = document.getElementById('targetSocketId').value.trim()
  if (inputValue === "") {
    alert('Please enter the socket id for calling.')
    return
  }
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

localVideo.addEventListener('click', async () => {
  if (bigVideoFrame === 'local') {
    //do nothing
  } else {
    //swap
    videoContainer.classList.toggle('toggle-swapped')
    bigVideoFrame = 'local'
  }

})

remoteVideo.addEventListener('click', async () => {
  if (bigVideoFrame === 'remote') {
    //do nothing
  } else {
    //swap
    videoContainer.classList.toggle('toggle-swapped')
    bigVideoFrame = 'remote'
  }
})


toggleAudio.addEventListener('click', async () => {
  isAudioMuted = !isAudioMuted

  audIcon.className = isAudioMuted ? "fas fa-microphone-slash" : "fas fa-microphone";
  const audioTrack = localStream.getAudioTracks()[0];
  audioTrack.enabled = !audioTrack.enabled
})

toggleVideo.addEventListener('click', async () => {
  isVideoMuted = !isVideoMuted;

  vidIcon.className = isVideoMuted ? "fas fa-video-slash" : "fas fa-video";
  const videoTrack = localStream.getVideoTracks()[0];
  videoTrack.enabled = !videoTrack.enabled

})






// Example: Watching camera & mic


// Example functions to toggle CSS/icon
function updateCameraIcon(state) {
  vidIcon.className = state === 'granted' ? "fas fa-video" : "fas fa-video-slash";
}

function updateMicIcon(state) {
  audIcon.className = state === 'granted' ? "fas fa-microphone" : "fas fa-microphone-slash";
}




// recording eventlistener

recordBtn.addEventListener('click', async () => {
  if (recordBtn.innerText === "RECORD") {
    console.log("Recording strarting......");

    //const { handleRecording } = await import('./webspeech.js');
    //handleRecording(); //this method uses the browser webspeech api for recording


    let combinedStream = new MediaStream([
      ...localStream.getTracks(),
      ...remoteStream.getTracks()
    ])
    audioRecorder = new AudioRecorder();
    audioRecorder.startRecording(combinedStream);

    pauseBtn.style.display = 'inline-block';
    recordBtn.innerText = "End Recording";
  } else if (audioRecorder && recordBtn.innerText === "End Recording") {
    //const { handleStopRecording } = await import('./webspeech.js');
    //handleStopRecording();
    pauseBtn.style.display = 'none';
    recordBtn.innerText = "RECORD";
    const blob = await audioRecorder.stopRecording();
    const file = new File([blob], 'meetingRecording.webm', { type: 'audio/webm' });
    const formData = new FormData();
    formData.append("audioFile", file)
    const response = await fetch("http://localhost:3000/transcript", {
      method: "POST",
      body: formData
    })

  }
});

pauseBtn.addEventListener('click', () => {
  audioRecorder.pauseRecording();

  //after clicking pause button dissappear it 
  pauseBtn.style.display = 'none';

   // let the pause button dissappear and resume button show
  resumeBtn.style.display = 'inline-block';
})
resumeBtn.addEventListener('click', () => {
  audioRecorder.resumeRecording();

  //after clicking resume button dissappear it 
  resumeBtn.style.display = 'none';

  // let the resume button dissappear and pause button show
  pauseBtn.style.display = 'inline-block';
})