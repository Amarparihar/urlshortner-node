require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');
const randomstring = require('randomstring');
const nodeMailer = require('nodemailer'); 

const Port = process.env.PORT || 5000;
const app = express();

const URL = process.env.dbURL || 'mongodb://localhost:27017';
const DB = 'urlshortnerdatabase';
console.log(URL);


app.use(express.json());
app.use(cors());

const transporter = nodeMailer.createTransport({
    service:'gmail',
    auth: {
        user: 'pariharamar1079@gmail.com',
        pass: '9284264870'
    }
});

app.get("/",async(req,res)=>{
    try {
        let client = await MongoClient.connect(URL);
        let db = client.db(DB);
        let data = await db.collection('users').find().toArray();
        if(data){
            res.status(200).json(data);
        }else{
            res.status(404).json({message:"Data Not Found"});
        }
       await client.close();
        
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})

app.post("/register", async(req,res)=>{
    try {
        let client = await MongoClient.connect(URL);
        let db = client.db(DB);
        let data = await db.collection('users').findOne({email:req.body.email})
        if(!data){
            let salt = await bcrypt.genSaltSync(10);
            let hash = await bcrypt.hashSync(req.body.password,salt)
            req.body.password = hash;
            await db.collection('users').insertOne(req.body);
            res.status(200).json({message:"user registered successfully"});
           

        }else{
            res.status(404).json({message:"user already registered"});
        }

        await client.close();
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})

app.post("/login", async(req,res)=>{
    try {
        let client = await MongoClient.connect(URL);
        let db = client.db(DB);
        let data = await db.collection('users').findOne({email:req.body.email})
        if(data){
            let isValid = await bcrypt.compareSync(req.body.password,data.password);
            if(isValid){
                let token = jwt.sign({user_id:data._id},process.env.JWT_KEY);
                console.log(token);
                res.status(200).json({message:"Login Successful",token});
                
            }else{
                res.status(401).json({message:"Invalid Creadentials"})
            }

        }else{
            res.status(404).json({message:"user not registered"});
        }
        await client.close();
        
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})


app.post('/forgot-password', async(req,res)=>{
    try {
        let client = await MongoClient.connect(URL);
        let db = client.db(DB);
        let data = await db.collection('users').findOne({email:req.body.email});
        if(data){
            let randomString = randomstring.generate({length:10,charset:'alphabetic'});
            console.log(randomString);
            res.status(200).json({message:'string genrated' , randomString});
            const mailOptions = {
                from: 'pariharamar1079@gmail.com', // sender address
                to: data.email, // list of receivers
                subject: 'Forgot password', // Subject line
                html: `<p>update ur password here <a href="http://localhost:3000/update-password">${randomString}</a> </p>`// plain text body
              };

            transporter.sendMail(mailOptions , (err,info)=>{
                if(err) throw err;
                console.log(info);
            })
           
            
        }else{
            res.status(404).json({message:'Insert valid email address'});
        }
        
        await client.close();
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})


app.put('/update-password', async(req,res)=>{
    try {
        let client = await MongoClient.connect(URL);
        let db = client.db(DB);
        let data = await db.collection('users').findOne({email:req.body.email});
      
        if(data.email){
            if(req.body.password == req.body.confirmPassword){
                let salt = await bcrypt.genSaltSync(10);
                let hash = await bcrypt.hashSync(req.body.password,salt);
                req.body.password = hash;
                
                await db.collection('users').findOneAndUpdate({email:req.body.email},{$set:{password:req.body.password}});
            res.status(200).json({message:'Password Updated'});
            
            }else{
                res.status(401).json({message:'Enter valid password'})
            }

        }else{
            res.status(404).json({message:'Enter valid email'})
        }
        await client.close();
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})




app.listen(Port,()=>console.log('The Server Is Running on Port:',Port));