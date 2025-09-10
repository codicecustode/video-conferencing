let recognition = null;
let transcript = 'data are ';
const handleRecording = async () => {

  let interimTranscript = '';
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.lang = "hi-IN";
  recognition.interimResults = true;
  recognition.onresult = (e) => {
    console.log("event-->",e)
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) {
        console.log("detected word ", e.results[i][0].transcript)
        transcript += e.results[i][0].transcript + " "
      } else {
        interimTranscript += e.results[i][0].transcript + " "
      }
      console.log("transcript---->", transcript)
      console.log("interimTranscript---->", interimTranscript)
    }

  }

  recognition.onaudiostart = (e) => {
    console.log("start capturing the voice")
  }
  recognition.onaudioend = (e) => {
    console.log("stop capturing the voice")
  }
  recognition.onstart = (e) => {
    console.log("recognition service start ")
  }
  recognition.onend = (e) => {
    console.log("recognition service end now restarting the service ")
    recognition.start()
  }
  recognition.onspeechstart = () => {
    console.log("🎤 Speech detected");
  };

  recognition.onspeechend = () => {
    console.log("🛑 Speech ended");
  };

  recognition.onnomatch = (e) => {
    console.warn("No match found", e);
  };

  recognition.onerror = (e) => {
    console.log("Type of error is --->  ", e.error)
    console.log("error message is --->  ", e.message)
    if (e.error === "not-allowed" || e.error === "service-not-allowed") {
      console.warn("⚠️ Microphone permissions issue. Not restarting.");
    }
  }
  recognition.start()
}

const handleStopRecording = () => {
  if (recognition) {
    recognition.onend = null; // prevent auto-restart
    recognition.stop();
    console.log("🛑 Recording stopped manually");
    console.log("here is ur recording data--->", transcript)
  }
};


export {
  handleRecording,
  handleStopRecording
}