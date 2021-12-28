import http from "http";
import express from "express";
import WebSocket from "ws";

const app = express();

app.set('view engine', "pug");
app.set("views", __dirname+ "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const handleListen = () => console.log(`Listening on ws://localhost:3000`);

const server = http.createServer(app);
const wss = new WebSocket.Server({server});

function handleConnection(socket) {
    console.log(socket)
}

function onSocketClose(socket) {
    console.log(`${socket} closed`);
}

const sockets = []

wss.on("connection", (socket) => {
    sockets.push(socket);

    socket["nickname"] = "Anon";

    console.log("Connected to Browser");

    socket.on("close", onSocketClose);
    socket.on("message", (message) => {

        const parsed = JSON.parse(message);
        if(parsed.type == "new_message"  ){
            sockets.forEach(aSocket => aSocket.send(`${socket.nickname}: ${ parsed.payload} `));
        }else if (parsed.type == "nickname"){
            //console.log("----")
            sockets.forEach(aSocket => aSocket.send(`${socket.nickname} changed the nickname to ${parsed.payload}`))
            socket["nickname"] = parsed.payload;
        }
        
    });
});

server.listen(3000, handleListen);