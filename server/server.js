import express from "express"
import dotenv from "dotenv"
dotenv.config()
import cors from "cors"
import http from "http"
import { ConnectDB } from "./lib/db.lib.js"
import UserRouter from "./routes/user.route.js"
import MessageRouter from "./routes/message.route.js"
import { Server } from "socket.io"
import { log } from "console"
const app = express();
const server = http.createServer(app);

//initialize socket.io server
export const io = new Server(server ,{
    cors:{origin:"*"}
})

//store all the online user
export const userSocketMap = {} //{userId:SocketId}


//socket.io connection Handler
io.on("connection" ,(socket)=>{
    const userId = socket.handshake.query.userId;
    console.log("user connected" , userId);

    if(userId) userSocketMap[userId] = socket.id

    //emit online users to all connected clients
    io.emit("getOnlineUsers" , Object.keys(userSocketMap));
    
    socket.on("disconnect" , ()=>{
        console.log("user disconnected");
        delete userSocketMap[userId];
        io.emit("getOnlineUsers" , Object.keys(userSocketMap))
    })
})

//Connect Database
await ConnectDB()
//middleware setup
app.use(express.json({limit:"4mb"}))
app.use(express.urlencoded({extended:true}))
app.use(cors())

//Route setup
app.use('/api/status' ,(req , res)=>{
    res.status(200).json({
        'message':"everything is fine"
    })
})
app.use('/api/auth' , UserRouter)
app.use('/api/messages' , MessageRouter)


if(process.env.NODE_ENV!=="production")
{
    const PORT = process.env.PORT || 3000
    server.listen(PORT , ()=>{
        console.log('server is up on port:'+PORT)
    })
}

export default server

