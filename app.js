const express=require('express');
const mongoose =require('mongoose');
const router=require('./routes.js');
const User=require('./models/user.js');
const Message =require('./models/messages.js');
const {authSocket} =require('./controllers/authentication.js');
const http=require('http');
const path=require('path');

const app=express();
app.use(express.static(path.join(__dirname,'public')));
const server=http.createServer(app);
const io=require('socket.io')(server);
io.use(authSocket);



var connections=[];
io.on('connection',socket=>{
    console.log('connected');
    
    socket.on('setOnline',()=>{
        connections[socket.user]=socket.id;
        console.log(connections);
    });

    socket.on('setOffline',()=>{
        connections[socket.user]=false;
        console.log(connections);
    });
    socket.on('disconnect',(r)=>{
        connections[socket.user]=false;
        console.log('disconnected');
    });

    socket.on('PrivateMessage',(data)=>{
        handleMessage(socket,data);

    });
});

const handleMessage=async (socket,data)=>{
    try{

        let user=await User.findOne({username:socket.user});
        let contact=await User.findOne({username:data.to});
        let messages;

        for(let i=0;i<user.contacts.length;i++){
            if(user.contacts[i].id.equals(contact._id)){
                messages = await Message.findById(user.contacts[i].data_id);
                break;
            }
        }
        let m={
            from:user.username,
            type:data.type,
            data:data.data,
            text:data.text,
        }
        await Message.updateOne(messages,{$push:{data:m}});
        m.to=data.to;
        
        if(connections[data.to]){
            io.to(connections[data.to]).emit('incomingMessage',m);
        }
    }catch(err){

    }
}



app.use(express.json());
app.use(router);
app.use(express.static('./img'));

mongoose.connect(process.env.DB_URL)
.then(()=>{
    server.listen(process.env.PORT || 8080);
    console.log("Server Started");
})
.catch((er)=>{console.log('Database Error');console.error(er);});
















