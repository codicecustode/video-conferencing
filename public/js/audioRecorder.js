export class AudioRecorder {
  constructor() {
    this.recorder = null;
    this.chunks = [];
  }
  startRecording(stream) {
    this.recorder = new MediaRecorder(stream);
    this.recorder.onstart = () => console.log("Recording started...");
    this.chunks = []
    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        console.log("data is available---")
        this.chunks.push(e.data);
        console.log("Data available:", e.data.size, "bytes");
      }
    }

    this.recorder.onpause = () => console.log("Recording paused.");
    this.recorder.onresume = () => console.log("Recording resumed.");
    this.recorder.onstop = () => console.log("Recording stopped.");
    this.recorder.onerror = (e) => console.error("Recording error:", e.error);

    this.recorder.start(1000);

  }

  pauseRecording() {
    if (this.recorder && this.recorder.state === 'recording') {
      console.log("Recording Paused.")
      this.recorder.pause();
    }
  }

  resumeRecording() {
    if (this.recorder && this.recorder.state === 'paused') {
      this.recorder.resume();
    }
  }

  stopRecording() {
    // if (this.recorder && (this.recorder.state === 'recording' || this.recorder.state === 'paused')) {

    //   this.recorder.onstop = async () => {
    //     console.log("Here is the all recorded data--->", this.chunks);
    //     const blob = new Blob(this.chunks, { type: 'audio/webm' });
    //     const file = new File([blob], 'meetingRecording.webm', { type: 'audio/webm' })
    //   }
    //   this.recorder.stop();
    // }

    return new Promise((resolve, reject) => {
      if (!this.recorder) {
        reject(new Error("No Recording Instance"));
        return
      }
      this.recorder.onstop = () => {
        try {
          console.log("Here is the all recorded data--->", this.chunks);
          const blob = new Blob(this.chunks, { type: 'audio/webm' });
          resolve(blob);
          return
        } catch (err) {
          reject(err.error || new Error("Recording Error"))
        }
      }
      this.recorder.onerror = (err)=>{
        reject(err.error)
      }

      this.recorder.stop();
    });
  }
}