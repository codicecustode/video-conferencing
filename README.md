README.md: |
  # 🎥 AI-Powered Video Conferencing App

  A real-time video conferencing web application built using WebRTC, Socket.IO, and Node.js, enhanced with AI-powered audio transcription and summarization.

  ---

  ## 🚀 Features

  ### 🔹 Real-Time Communication
  - Peer-to-peer video & audio calls using WebRTC
  - Socket.IO signaling server
  - STUN + TURN (coturn) support
  - Live connected users list

  ### 🔹 Media Controls
  - Mute / unmute microphone
  - Enable / disable camera
  - Swap local & remote video
  - Permission monitoring

  ### 🔹 Meeting Recording
  - Record combined audio (local + remote)
  - Pause & resume recording
  - Export as `.webm`

  ### 🔹 AI Transcription
  - Audio → text using OpenAI (`gpt-4o-transcribe`)
  - REST API based transcription

  ### 🔹 AI Summarization (WIP)
  - Hugging Face model: facebook/bart-large-cnn
  - Generates summary + key points

  ---

  ## 🧠 Tech Stack

  **Frontend**
  - HTML, CSS, JavaScript (ES Modules)
  - WebRTC, MediaRecorder API
  - Socket.IO Client

  **Backend**
  - Node.js (ESM)
  - Express
  - Socket.IO
  - Multer
  - OpenAI SDK
  - Hugging Face API

  **Infrastructure**
  - STUN (Google)
  - TURN (Coturn)

  ```

  ## 📂 Project Structure

  video-conferencing/
  ├── public/
  │   ├── index.html
  │   └── js/
  │       ├── main.js
  │       ├── audioRecorder.js
  │       └── socket.io.js
  ├── server.js
  ├── summarizer.js
  ├── package.json
  ├── .gitignore
  └── README.md

  ```

  ## ⚙️ Environment Variables

  PORT=3000  
  OPENAI_API_KEY=your_openai_api_key  

  TURN_URL=turn:your-turn-server:3478  
  TURN_USERNAME=your_turn_username  
  TURN_PASSWORD=your_turn_password  

  HF_TOKEN=your_huggingface_token  
  HF_URL=https://api-inference.huggingface.co/models

  ---

  ## 🛠️ Setup

  npm install  
  npm run dev  

  App runs at: http://localhost:3000

  ---

  ## 🎙️ Recording & Transcription Flow

  1. Start recording during a call
  2. Local + remote audio merged
  3. Audio uploaded to `/transcript`
  4. OpenAI converts speech to text
  5. Transcript returned as JSON

  ---

  ## 🔌 API

  POST /transcript  
  multipart/form-data → audioFile  

  Response:
  {
    "text": "Transcribed meeting text"
  }

  ---

  ## 🧪 TODO

  - UI for transcript & summary
  - Auto-summarization
  - Multi-user calls
  - Chat support
  - Persistent meeting history

  ---

  ## 👨‍💻 Author

  Aman Kumar Singh  
  Backend Engineer | Node.js | WebRTC | AI Systems

  ---

  ## 📄 License

  ISC License
