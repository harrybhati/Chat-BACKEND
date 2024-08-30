const mongoose=require('mongoose');
mongoose.connect("mongodb+srv://harendrabhati:Tannu121@cluster0.zwgiw.mongodb.net/Chat").then(() => {
    console.log('Connected to MongoDB');
    
})
.catch(err => console.log(err));;