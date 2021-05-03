const socket = io()

//elements
const $messageForm = document.querySelector('#messageForm')
const $messageFormInput = document.querySelector('#message')
const $messageButton = document.querySelector('#formSubmit')
const $locationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')


// templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationURLtemplate = document.querySelector('#locationURL-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML


// options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscroll = ()=>{
    // new message element
    const $newMessage = $messages.lastElementChild

    //height of new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin


    // console.log(newMessageStyles)

    // visible height
    const visibleHeight = $messages.offsetHeight

    // height of messages container
    const containerHeight = $messages.scrollHeight

    // how far have i scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight
    
    if(containerHeight- newMessageHeight <= scrollOffset){
         $messages.scrollTop = $messages.scrollHeight
    }
    
}

socket.on('message', ({username, text, createdAt})=>{
    // console.log(message)
    // var node = document.createElement("p");                
    // var textnode = document.createTextNode(message);         
    // node.appendChild(textnode); 
    // allMessages.appendChild(node)
    const html = Mustache.render(messageTemplate,{
        username,
        message: text,
        createdAt: moment(createdAt).format('hh:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()

})
  

// const message = document.querySelector('#message')

$messageForm.addEventListener('submit',(event)=>{
    event.preventDefault();
    // disable 
    $messageButton.setAttribute('disabled', 'disabled')


    const message = $messageFormInput.value
    if(message === ""){
        return $messageButton.removeAttribute('disabled')
    }
    socket.emit('sendMessage', message,(error)=>{
        //enable
        $messageButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageButton.focus()
        if(error){
            return console.log(error)
        }
        console.log('delivered')
    })
})

$locationButton.addEventListener('click',()=>{
    $locationButton.disabled = true
    if(!navigator.geolocation)
        return console.log("Your browser doesn't support geolocation")
    navigator.geolocation.getCurrentPosition((location)=>{
        socket.emit('sendUserLocation', {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
        },(status)=>{
            console.log(status)
            $locationButton.disabled = false
        })
    })
})

socket.on('locationMessage', ({username, url, createdAt})=>{
    const html = Mustache.render(locationURLtemplate, {
        username,
        url, 
        createdAt: moment(createdAt).format('hh:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({room, users})=>{
    const html = Mustache.render(sidebarTemplate,{
        room,
        users,
    })
    document.querySelector('#sidebar').innerHTML = html
})

socket.emit('join', {username, room}, (error)=>{
    if(error){
        alert(error)
        location.href='/'
    }
})

