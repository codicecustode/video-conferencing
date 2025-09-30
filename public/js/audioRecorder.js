export class Audiorecorder {
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
        this.chunks.push(e.data);
        console.log("Data available:", e.data.size, "bytes");
      }
    }

    this.recorder.onpause = () => console.log("Recording paused.");
    this.recorder.onresume = () => console.log("Recording resumed.");
    this.recorder.onstop = () => console.log("Recording stopped.");
    this.recorder.onerror = (e) => console.error("Recording error:", e.error);

    recorder.start(1000);

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
    if (this.recorder && this.recorder.state === 'paused') {
      this.recorder.stop();
      console.log("Here is the all recorded data--->", this.chunks);
    }
  }
}