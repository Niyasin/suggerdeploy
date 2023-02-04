 const mongoose = require('mongoose');
 const {randomBytes,scryptSync,timingSafeEqual} =require('crypto');
 const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
    },
    password:{
        type:String,
        required:true,
    },
    displayname:{
        type:String
    },
    status:{

        type:Boolean,
    },
    profilePic:{
        type:String,
        default:'./img/unknown.jpg',
    },
    contacts:[{
        id:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"user",
        },
        data_id:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"data",
        }

    }],
 });

userSchema.post('save',(doc,next)=>{
    console.log("signup");
    next();
});
userSchema.pre('save',function(next){
    console.log(this.password);
    let salt=randomBytes(16).toString('hex');
    let hashed=scryptSync(this.password,salt,32).toString('hex');
    this.password=hashed+':'+salt;
    next();
});

userSchema.statics.login=async function(username,password){
    const user=await this.findOne({username});
    if(user){
        let [pw,salt]=user.password.split(':');
        let hashed=scryptSync(password,salt,32);
        let buffer = Buffer.from(pw,'hex');
        let auth = timingSafeEqual(buffer,hashed);
        if(auth){
            return user;
        }else{
            throw Error('Invalied Password');
        }
    }else{
        throw Error('Invalied username');
    }
}

userSchema.statics.search=async function(word){
    const docs =await this.find({ "username" : { $regex: word, $options: 'i' }});
    let data=[];
    docs.forEach(e=>{
        data.push({username:e.username,displayname:e.displayname,profilePic:e.profilePic});
    });
    return data;
}


 const User =mongoose.model('user',userSchema); 
 module.exports=User;