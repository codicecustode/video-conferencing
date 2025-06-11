import express from 'express';
import { createServer } from 'http'

const app = express();
const server = createServer(app)

app.get('/',(req, res)=>{
res.send('Server Running on port 3000')
})

server.listen('3000',()=>{
  console.log(`[RUNNING] -->  Server is running on port 3000 : http://localhost:3000`)
});
