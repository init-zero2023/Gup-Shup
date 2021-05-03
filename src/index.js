const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')

const { generateMessage, generateLocationMessage} = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')

const port = process.env.PORT || 3500
const app = express();
const server = http.createServer(app)  // create new server
const io = socketio(server)   // socket expects the raw http server if we create it using express only we won't get express to raw http


const publicPath = path.join(__dirname, '../public');
// console.log(publicPath)/

app.use(express.static(publicPath))
let count = 0

// server(emit) -> client(receive) -> acknowledgement -> server
// client(emit) -> server(receive) -> acknowledgement -> client

io.on('connection', (socket)=>{
    console.log("New Web Socket connection")

    socket.on('join', ({username, room}, callback)=>{
		const {error, user} = addUser({
			id: socket.id,
			username, 
			room
		})

		if(error){
			return callback(error)
		}
        socket.join(user.room)        
        // socket.emit, io.emit. socket.broadcast.emit
        // new setups for emitting messages
        // io.to.emit() and socket.broadcast.to.emit() both are used for a specific socket room
        
        socket.emit('message', generateMessage(user.username, 'Welcome to chat room'))
        socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined.`))

		io.to(user.room).emit('roomData',{
			room: user.room,
			users: getUsersInRoom(user.room)
		})

		callback()
    })

    socket.on('sendMessage', (message, callback)=>{
        const filter =  new Filter()
        if(filter.isProfane(message)){
            return callback('Profanity is not allowed')
        }
		const user = getUser(socket.id)
        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback()  // for acknowledgement
    })
    socket.on('disconnect', ()=>{
		const user = removeUser(socket.id)

		if(user){
			io.to(user.room).emit('message', generateMessage(`${user.username} has left`))
			io.to(user.room).emit('roomData', {
				room: user.room,
				users: getUsersInRoom(user.room)
			})
		}

    })
    socket.on('sendUserLocation', ({latitude, longitude}, callback)=>{
        const user = getUser(socket.id)
		if(!latitude ||!longitude)
            return callback('Unable to share location')
		
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${latitude},${longitude}`))
        callback('Location shared!!')
    })


})


server.listen(port,()=>{
    console.log(`server is starting at ${port}`)
})