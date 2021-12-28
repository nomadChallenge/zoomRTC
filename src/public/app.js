//alert("hi");

const messageList = document.querySelector("ul");
const messageForm = document.querySelector("#message")
const nickForm = document.querySelector("#nickname")

const nick = document.querySelector("#nick")

const socket = new WebSocket(`ws://${window.location.host}`)

function makeMessage(type, payload){
    const msg = {type, payload}

    return JSON.stringify(msg);
}

function handleOpen(event){
    console.log("Connected to Server");
}

socket.addEventListener("open", handleOpen);

socket.addEventListener("message", (message) =>{
    const li = document.createElement("li");

    li.innerText = message.data  ;
    messageList.append(li);
});
function handleSubmit(event) {
    event.preventDefault();
    const input = messageForm.querySelector("input");
    socket.send( makeMessage("new_message", input.value) );

    //input.value = "";
    
}


function handleNickSubmit(event) {
    event.preventDefault();

    const NickInput = nickForm.querySelector("input");

    if( NickInput.value !== nick.innerText ){

        socket.send(makeMessage("nickname",NickInput.value));

        nick.innerText = NickInput.value;
    }
}

messageForm.addEventListener("submit", handleSubmit);
nickForm.addEventListener("submit", handleNickSubmit);

//btn.addEventListener('click', fn)