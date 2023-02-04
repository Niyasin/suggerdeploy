const jwt = require('jsonwebtoken');
const User=require('../models/user');
const {scryptSync,timingSafeEqual} =require('crypto');
const secret='nothing much';

const createToken=(id)=>{
    return jwt.sign({id},secret,{
        expiresIn:100*60,
    });
}


module.exports.signup=async (req,res)=>{
    let {username,password}=req.body;
    try{
        const user =await User.create({username,password,displayname:username});
        const token = createToken(user._id);
        res.setHeader('Set-Cookie',`token=${token}`);
        res.json({token,error:undefined});
    }catch(err){
        console.log(err.message);
        if(err.code==11000){
            res.json({token:undefined,error:'User Already Exist'});
        }else{
            res.json({token:undefined,error:'Password is too short'});

        }
    }
}

module.exports.login=async(req,res)=>{
    let {username,password}=req.body;
    try{
        let user=await User.login(username,password);
        let token =createToken(user.username);
        res.setHeader('Set-Cookie',`token=${token}`);
        res.json({token,error:undefined});
    }catch(err){
        res.json({token:undefined,error:err.message});
    }
}

module.exports.changePassword= async(req,res)=>{
    let {oldPassword,newPassword} =req.body;
    const user=await User.findOne({username:req.user});
    if(user && newPassword && newPassword.length>5){
        let [pw,salt]=user.password.split(':');
        let hashed=scryptSync(oldPassword,salt,32);
        let buffer = Buffer.from(pw,'hex');
        let auth = timingSafeEqual(buffer,hashed);
        if(auth){
            let h=await scryptSync(newPassword,salt,32).toString('hex');
            let p=h+':'+salt;
            try{
                await User.updateOne(user,{password:p});
            }catch(err){
                
            }
            res.send('success');
        }else{
            res.send('error');
        }
    }else{
        res.send('error'); 
    }
}

module.exports.resetToken=(req,res,username)=>{
    let token =createToken(username);
    res.setHeader('Set-Cookie',`token=${token}`);
}

module.exports.auth =async(req,res,next)=>{
    const token = req.cookies.token;
    if(token){
        await jwt.verify(token,secret,(err,decoded)=>{
            if(err){
                res.send('unauthorised request');
            }else{
                req.user=decoded.id;
                next();
            }
        });
    }else{
        res.send('unauthorised request')
    }
}

module.exports.authSocket =async(socket,next)=>{
    if(socket.handshake.query && socket.handshake.query.token){
        let token=socket.handshake.query.token;
        await jwt.verify(token,secret,(err,decoded)=>{
            if(decoded){socket.user=decoded.id};
            next();
        });
    }
}