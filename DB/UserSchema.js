const mongoose=require('mongoose');

const UserSch= new mongoose.Schema({
    name:{type:String,required:true},
    email:{
        type:String,
        unique:true,required:true
    },
    password:{type:String,required:true}
},{collection:'user',timestamps:true});


const Chat = mongoose.models.user || mongoose.model("user", UserSch);

module.exports = Chat;