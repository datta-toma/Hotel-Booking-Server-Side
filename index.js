const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());


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

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const RoomsCollection = client.db('hotelRoom').collection('Rooms');
    const bookingCollection = client.db('hotelRoom').collection('booking');
    const reviewCollection = client.db('hotelRoom').collection('reviews');


    app.get('/Rooms', async(req, res)=>{
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

  app.get('/bookings', async(req, res)=>{
    console.log(req.query.email);
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