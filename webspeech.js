const handleRecording = async () => {
  let transcript = '';
  let interimTranscript = '';
  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.lang = "hi-IN";
  recognition.interimResults = true;
  recognition.onresult = (e) => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i][0].isFinal) {
        transcript += e.results[i][0].transcript + " "
      } else {
        interimTranscript += e.results[i][0].transcript + " "
      }
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
    console.log("recognition service start ")
  }
  recognition.onerror = (e) => {
    console.log("Type of error is --->  ", e.error)
    console.log("error message is --->  ", e.message)
  }
  recognition.start()
}

export {
  handleRecording
}