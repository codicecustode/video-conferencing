import express from 'express';
import multer from 'multer';
import OpenAI from 'openai';
import fs from 'fs'
import dotenv from "dotenv";
dotenv.config();
import { createServer } from 'http'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { Server } from 'socket.io';
const app = express();
const server = createServer(app)

const io = new Server(server)

const upload = multer();

const __dirname = dirname(fileURLToPath(import.meta.url))

app.use(express.static(join(__dirname, 'public')))
app.get('/', (req, res) => {
  //dirname(fileURLToPath(import.meta.url))
  res.sendFile(join(__dirname + '/public' + '/index.html'))
})

io.on('connection', (socket) => {

  io.emit('socket-list', Array.from(io.sockets.sockets.keys()))

  console.log("A user is connected with socket ID ---->", socket.id)

  socket.on('offer', (data) => {
    console.log("Offer is Received successfully and send to another peer")
    io.to(data.to).emit('offer', {
      from: data.from,
      offer: data.offer
    });
  })

  socket.on('answer', (data) => {
    console.log("Answer is received and send to the other side peer")
    io.to(data.to).emit('answer', {
      from: data.from,
      to: data.to,
      answer: data.answer
    })
  })

  socket.on('ice-candidate', async (data) => {
    console.log("Ice candidate received and send ")
    io.to(data.to).emit('ice-candidate', {
      from: data.from,
      to: data.to,
      candidate: data.candidate
    })
  })

  socket.on('hang-up', (data) => {
    io.to(data.to).emit({
      from: data.to,
      msg: "call disconnected"
    })
  })




  socket.on('disconnect', (data) => {
    console.log("Disconnection Request Received.")
    console.log("Disconnection Request data", data)
    io.emit('socket-list', Array.from(io.sockets.sockets.keys()))
  })

});


app.post('/transcript', upload.single('audioFile'), async (req, res) => {
  const path = "temp.webm"
  try {
    console.log("[Endpoint transcript hit]")
    const openai = new OpenAI();
    const fileBuffer = req.file.buffer;

    fs.writeFileSync(path, fileBuffer);
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(path),
      model: "gpt-4o-transcribe",
    });

    console.log("This is the transcription text-->", transcription.text);

    res.status(200).json({
      text: transcription.text
    })
    fs.unlinkSync(path);
  } catch (err) {
    console.log("[ERROR]-->", err)
    res.status(500).json({ error: err.message });
  } finally {
    // always try to delete the file
    fs.unlink(path, (unlinkErr) => {
      if (unlinkErr) console.log("[UNLINK ERROR]-->", unlinkErr);
      else console.log("Temp file deleted successfully");
    });
  }
})


app.post('/summarizer', async (req, res) => {

  const { text } = req.body;
  const summarizer = new HuggingFaceSummarizer(process.env.HF_TOKEN);
  const summarizedText = await summarizer.summarize(text);

  //call the class for summarization

})


server.listen('3000', () => {
  console.log(dirname(fileURLToPath(import.meta.url)))
  console.log(`[RUNNING] -->  Server is running on port 3000 : http://localhost:3000`)
});
