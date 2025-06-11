import express from 'express';
import { createServer } from 'http'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
const app = express();
const server = createServer(app)

const __dirname = dirname(fileURLToPath(import.meta.url))

app.use(express.static(join(__dirname, 'public')))
app.get('/', (req, res) => {

  //dirname(fileURLToPath(import.meta.url))

  res.sendFile(join(__dirname + '/public' + '/index.html'))
})

server.listen('3000', () => {
  console.log(dirname(fileURLToPath(import.meta.url)))
  console.log(`[RUNNING] -->  Server is running on port 3000 : http://localhost:3000`)
});
