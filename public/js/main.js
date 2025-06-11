const video = document.getElementById('camera');
const loadingText = document.querySelector('.loading-text');

// Ask for camera access
navigator.mediaDevices.getUserMedia({ video: true, audio: false })
  .then(stream => {
    console.log("Stream obtained:", stream);
    video.srcObject = stream;
    video.play();  // optional but safe to include
    loadingText.textContent = "Camera feed is live!";
  })
  .catch(err => {
    console.error('Camera access error:', err);
    loadingText.textContent = "Failed to access camera.";
  });
