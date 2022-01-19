const socket = io();

const myFace = document.getElementById("myFace");

const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camaerasSelect = document.getElementById("cameras");

const call = document.getElementById("call")

const roomTitle = document.getElementById("roomName");


call.hidden = true

let myStream;
let muted = true;

let cameraOff = false;
let roomName;

let myPeerConnection;

async function getCameras() {
    try{
        const devices = await navigator.mediaDevices.enumerateDevices();
        console.log(devices)
        const cameras = devices.filter( (devices) =>devices.kind ==="videoinput" );
        const currentCamera = myStream.getVideoTracks()[0];
        
        cameras.forEach( (camera) =>{
            const option = document.createElement("option")
            option.value = camera.deviceId;
            option.innerText = camera.label;

            if(currentCamera.label === camera.label){
                option.selected = true;
            }
            camaerasSelect.appendChild(option)
        });
        console.log(cameras);
    }catch(e){
        console.log(e);
    }
}

async function getMedia(deviceId){
    const initialConstraints = {
        audio: true,
        video: {facingMode: "user"},
    };

    const cameraConstraints = {
        audio: true,
        video: {deviceId:{exact: deviceId} },
    };
    try {
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId ? cameraConstraints: initialConstraints
        );
        myFace.srcObject = myStream;

        if(!deviceId){
            //console.log("-----")
            await getCameras();
        }

        handleMuteClick();
    } catch(e){
        console.log(e);
    }
}


function handleMuteClick(){
    myStream.getAudioTracks().forEach( 
        (track) => (track.enabled = !track.enabled)  );

    if(!muted){
        muted = true;
        muteBtn.innerText = "Unmute";
    }else{
        muted = false;
        muteBtn.innerText = "Mute";
    }
}

function handleCameraClick() {
    myStream.getVideoTracks().forEach( (track) => (track.enabled = !track.enabled));

    if(cameraOff){
        cameraOff = false;
        cameraBtn.innerText = "Turn Camera Off";
    }else{
        cameraOff = true;
        cameraBtn.innerText = "Turn Camera On";
    }
}

async function handleCameraChange(){
    await getMedia(camaerasSelect.value);

    if(myPeerConnection){
        const videoTrack = myStream.getVideoTracks()[0];

        const videoSender = myPeerConnection
            .getSenders()
            .find(sender => sender.track.kind === "video");

        videoSender.replaceTrack(videoTrack)
    }
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);

camaerasSelect.addEventListener("input", handleCameraChange);

// Welcome Form (join a room)
const welcome = document.getElementById("welcome")
const welcomeForm = welcome.querySelector("form")

async function startMedia(){
    welcome.hidden = true;
    call.hidden = false

    await getMedia();

    makeConnection();
}

async function handleWelcomSubmit(event){
    event.preventDefault();

    const input = welcomeForm.querySelector("input");

    await startMedia();
    socket.emit("join_room", input.value)
    roomName = input.value;

    roomTitle.innerText = "Room Name: "+roomName

    input.value = "";

}

welcomeForm.addEventListener("submit", handleWelcomSubmit)


// Socket code
socket.on("welcome", async  () => {
    const offer = await myPeerConnection.createOffer();

    myPeerConnection.setLocalDescription(offer)

    console.log("send the offer");

    socket.emit("offer", offer, roomName)
    //console.log("someone joined");

})

socket.on("offer", async(offer)=> {
    console.log("receive the offer")
    myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer()

    console.log("1234 ",answer)

    myPeerConnection.setLocalDescription(answer);

    socket.emit("answer", answer, roomName);
})

socket.on("answer", (answer) =>{
    myPeerConnection.setRemoteDescription(answer);
})

socket.on("ice", ice=>{
    console.log("receive candidate")
    myPeerConnection.addIceCandidate(ice);
})

// RTC Code

function makeConnection(){
    myPeerConnection = new RTCPeerConnection( 
        {
            iceServers:[
                {
                    urls: 
                        "stun:stun.l.google.com:19302",
                        /*"stun:stun1.l.google.com:19302",
                        "stun:stun2.l.google.com:19302",
                        "stun:stun3.l.google.com:19302",
                        "stun:stun4.l.google.com:19302",
                    ]*/
                },
            ],
        } 
    );
    myPeerConnection.addEventListener("icecandidate", handleIce)

    myPeerConnection.addEventListener("track", handleTrack);

    myStream
        .getTracks()
        .forEach( track => myPeerConnection.addTrack(track, myStream))
}

function handleIce(data){
    console.log("Send candidate")
    socket.emit("ice", data.candidate  , roomName)
    
    console.log(data)
}

function handleTrack(data){
    const peerFace = document.getElementById("peerFace")

    //console.log("stream-----: ",data.streams)

    peerFace.srcObject = data.streams[0];

    console.log("got an event from my peer");
    console.log("Peer's stream", data.streams[0] )

    console.log("My Stream", myStream)
}