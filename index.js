const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());


console.log(process.env.DB_PASS)



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cg4ihxy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


 // middlewares
 const logger = async(req, res, next) =>{
  console.log('called', req.method, req.url)
  next();
}

const verifyToken = async(req, res, next) =>{
  const token = req?.cookies?.token;
  console.log('value of token', token)
  if(!token){
    return res.status(401).send({message: 'not authorized'})
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) =>{
    //  error
    if(err){
      console.log(err);
      return res.status(401).send({message: 'unauthorized'})
    }

    // if token is valid then it would be decoded
    console.log('value in the token', decoded)
    req.user = decoded;
    next()
  })

}



async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const RoomsCollection = client.db('hotelRoom').collection('Rooms');
    const bookingCollection = client.db('hotelRoom').collection('booking');
    const reviewCollection = client.db('hotelRoom').collection('reviews');

    // auth related api
    app.post('/jwt', logger, async(req, res)=>{    
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
      res
      .cookie('token', token, {
        httpOnly: true,
        secure: true,
        
      })
      .send({success: true})
    })

    // logout
    app.post('logout', async(req, res) =>{
      const user = req.body;
      console.log('login out', user);
      res.clearCookie('token', {maxAge: 0}).send({success: true})
    })

    //  hotel related api
    app.get('/Rooms', logger, async(req, res)=>{
        const cursor = RoomsCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    })


    app.get('/Rooms/:id', async(req, res)=>{
        const id = req.params.id;
        const query ={_id: new ObjectId(id)}
        const result = await RoomsCollection.findOne(query);
        res.send(result);
    })


  //   handle booking
  app.post('/Rooms/:id', async (req, res) => {
    try {
        const roomId = req.params.id;
        await RoomsCollection.updateOne({ _id: new ObjectId(roomId) }, { $set: { availability: false } });
        res.status(200).send({ message: "Room booked successfully!" });
    } catch (error) {
        console.error("Error booking room:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// bookings

  app.get('/bookings', logger, verifyToken, async(req, res)=>{
    console.log(req.query.email);
    console.log('token page', req.cookies.token)
    if(req.user.email !== req.query.email){
      return res.status(403).send({message: 'forbidden access'})
    }
    let query = {};
    if(req.query?.email){
      query = {email: req.query.email}
    }
    const result = await bookingCollection.find(query).toArray();
    res.send(result);
  })

  app.post('/bookings', async (req, res) => {
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
  });


  // DELETE a booking by ID
  app.delete('/bookings/:id', async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await bookingCollection.deleteOne(query);
    res.send(result);
  });

    

  // update
app.patch('/bookings/:id', async(req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const updatedBooking = req.body; 
      const updateDoc = {
          $set: {
            date: updatedBooking.date,
          }
      };

      const result = await bookingCollection.updateOne(filter, updateDoc);
      res.send(result);
});

// review
app.get('/reviews', async(req, res)=>{
  const cursor = reviewCollection.find();
  const result = await cursor.toArray();
  res.send(result);
})

app.get('/reviews/:id', async(req, res)=>{
  const id = req.params.id;
  const query ={_id: new ObjectId(id)}
  const result = await reviewCollection.findOne(query);
  res.send(result);
})



    // POST route to save reviews
    app.post('/reviews', async (req, res) => {
      const { review } = req.body;
      const result = await reviewCollection.insertOne(review );
      res.send(result);
    });

 

  


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req, res) =>{
    res.send('run the hotel page')
})

app.listen(port, () =>{
    console.log(`run the hotel page server running ${port}`)
})