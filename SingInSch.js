const mongoose=require('mongoose');

const UserSch= new mongoose.Schema({
    name:String,
    email:{
        type:String,
        unique:true
    },
    password:String
},{collection:'Chat'});


module.exports=mongoose.model('Chat',UserSch);


