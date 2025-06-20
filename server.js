import express from 'express';
import { createServer } from 'http'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { Server } from 'socket.io';
const app = express();
const server = createServer(app)

const io = new Server(server)

const __dirname = dirname(fileURLToPath(import.meta.url))

app.use(express.static(join(__dirname, 'public')))
app.get('/', (req, res) => {
  //dirname(fileURLToPath(import.meta.url))
  res.sendFile(join(__dirname + '/public' + '/index.html'))
})

io.on('connection', (socket) => {

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



  socket.on('disconnect', (data) => {
    console.log("Disconnection Request Received.")
    console.log("Disconnection Request data", data)
  })

});


server.listen('3000', () => {
  console.log(dirname(fileURLToPath(import.meta.url)))
  console.log(`[RUNNING] -->  Server is running on port 3000 : http://localhost:3000`)
});
