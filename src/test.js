const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')

const port = process.env.PORT || 3000
const app = express();
const server = http.createServer(app)  // create new server
const io = socketio(server)   // socket expects the raw http server if we create it using express only we won't get express to raw http


const publicPath = path.join(__dirname, '../public');
// console.log(publicPath)/

app.use(express.static(publicPath))
let count = 0

// server(emit) -> client(receive) -> countUpdated
// client(emit) -> server(receive) -> countIncrement

io.on('connection', (socket)=>{
    console.log("New Web Socket connection")
    
    socket.emit('countUpdated', count)

    socket.on('countIncrement', ()=>{
        count++;
        // socket.emit('countUpdated', count)
        io.emit('countUpdated', count)
    })

})


server.listen(port,()=>{
    console.log(`server is starting at ${port}`)
})