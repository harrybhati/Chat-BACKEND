const mongoose=require('mongoose');
mongoose.connect("mongodb+srv://harendrabhati:Tannu121@cluster0.zwgiw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0").then(() => {
    console.log('Connected to MongoDB');
    
})
.catch(err => console.log(err));;
