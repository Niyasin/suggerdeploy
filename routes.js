const { Router } =require('express');
const {signup,login,auth,changePassword} = require('./controllers/authentication.js');
const router = Router();
const User=require('./models/user.js');
const Message=require('./models/messages.js');
const path=require('path')
const secret='nothing much';
const cookieParser = require('cookie-parser');
const multer = require('multer');
var upload=multer();

router.use(cookieParser());

router.get('/',(req,res)=>{
    res.sendFile(path.join(__dirname,'public','index.html'));
})
router.post('/login',login);
router.post('/authToken',auth,(req,res)=>{
    res.json({
        validity:true,
        username:req.user,
    });
});

router.post('/signup',signup);

router.get('/getUserData',async (req,res)=>{
    let username=req.query.u;
    try{
        let user =await User.findOne({username});
        res.json({
            username:user.username,
            name:user.displayname,
            profilePic:user.profilePic?user.profilePic:'./img/unknown.jpg',
        });
    }catch(e){

    }
});


router.get('/search',auth,async (req,res)=>{
    let q=req.query.q;
    let list=await User.search(q);
    res.json(list);
});



router.post('/addContact',auth,async(req,res)=>{
    let contact_username=req.body.contact;
    try{
        let  user= await User.findOne({username:req.user});
        let contact= await User.findOne({username:contact_username});
        console.log('jdsfh',user,contact);

        let exist=false;
        for(let i=0;i<user.contacts.length;i++){
            if(contact._id.equals(user.contacts[i].id)){
                exist=true;
                break;
            }
        }
        if(!exist){
            let data=await Message.create({users:[user._id,contact._id],data:[]});
            await User.updateOne(user,{$push:{contacts:{id:contact._id,data_id:data._id}}});
            await User.updateOne(contact,{$push:{contacts:{id:user._id,data_id:data._id}}});
            res.send('contact added');
        }else{
            res.send('contact alredy exist');
        }
    }catch(err){
        res.send('error');
    }``
});



router.get('/getContacts',auth,async(req,res)=>{
    try{
        let user=await User.findOne({username:req.user}).select('contacts.id').populate('contacts.id',['username','displayname','profilePic']);
        let contacts=user.contacts.map(e=>{return {username:e.id.username,displayname:e.id.displayname,profilePic:e.id.profilePic}});
        res.json(contacts);
    }catch(err){
        res.status(200);
    }
});

router.post('/getMessages',auth,async(req,res)=>{
    console.log(req.body);
    try{
        let contact=await User.findOne({username:req.body.contact});
        let user=await User.findOne({username:req.user});
        for(let i=0;i<user.contacts.length;i++){
            if(user.contacts[i].id.equals(contact._id)){
                let messages =await Message.findById(user.contacts[i].data_id).exec((err,data)=>{
                    res.json(data.data||[]);

                });
            }
        }
    }catch(err){
        res.status(200);
    }
});
router.post('/updateProfilePic',auth,upload.single('data'),async(req,res)=>{
    let image=req.file;
    let user = await User.findOne({username:req.user});
    try{
        let encoded=`data:${image.mimetype};base64,${image.buffer.toString('base64')}`;
        await User.updateOne(user,{profilePic:encoded});
        res.send('success');
      
    }catch(err){
        res.send('error');
    }
});


router.post('/updateDisplayName',auth,async(req,res)=>{
    let newDN=req.body.displayname;
    let user = await User.findOne({username:req.user});
    try{
        await User.updateOne(user,{displayname:newDN});
        res.json({displayname:newDN});
    }catch(err){
    }
});

router.post('/changePassword',auth,changePassword);

module.exports=router;