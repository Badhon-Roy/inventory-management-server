const express = require('express')
const app = express()
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors')
const port = process.env.PORT || 5000;


// middleware
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wj0pjif.mongodb.net/?retryWrites=true&w=majority`;

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
    const shopCollection = client.db("inventoryDB").collection("shops");
    const userCollection = client.db("inventoryDB").collection("users");
    const productCollection = client.db("inventoryDB").collection("products");
    const salesCollection = client.db("inventoryDB").collection("sales");
    const offersCollection = client.db("inventoryDB").collection("offers");


    // user related api
    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user?.email }
      const existingUser = await userCollection.findOne(query)
      if (existingUser) {
        return res.send({ massage: "user already exists" })
      }
      const result = await userCollection.insertOne(user)
      res.send(result)
    })

    app.get('/users/admin/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query)
      let admin = false;
      if (user) {
        admin = user?.role === 'admin';
      }
      res.send({ admin })
    })


    app.get('/users/manager/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query)
      let manager = false;
      if (user) {
        manager = user?.role === 'manager';
      }
      res.send({ manager })
    })

    app.patch('/users/manager/:email', async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const updatedDoc = {
        $set: {
          role: 'manager'
        }
      }
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })

    // product related api
    app.get('/products', async (req, res) => {
      let query = {};
      if (req?.query?.email) {
        query = { email: req?.query?.email }
      }
      const result = await productCollection.find(query).toArray();
      res.send(result)
    })
    app.get('/products/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await productCollection.findOne(query);
      res.send(result)
    })
    app.post('/products', async (req, res) => {
      const product = req.body;
      const result = await productCollection.insertOne(product)
      res.send(result)
    })
    app.patch('/products/:id', async (req, res) => {
      const id = req.params.id
      const product = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          ...product
        },
      };
      const result = await productCollection.updateOne(filter, updateDoc, options);
      res.send(result)
    })
    app.delete('/products/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productCollection.deleteOne(query);
      res.send(result)
    })


    // shops related api
    app.get('/shops', async (req, res) => {
      let query = {};
      if (req?.query?.shop_owner_email) {
        query = { shop_owner_email: req?.query?.shop_owner_email }
      }
      const result = await shopCollection.findOne(query);
      res.send(result)
    })
    app.post('/shops', async (req, res) => {
      const shop = req.body;
      const result = await shopCollection.insertOne(shop);
      res.send(result)
    })


    // sales product related api
    app.post("/sales", async (req, res) => {
      const product = req.body;
      const result = await salesCollection.insertOne(product)
      res.send(result)
    })


    // increment 
    app.put('/products/:id/increment', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productCollection.updateOne(
        query,
        { $inc: { sale_count: 1 } },
        { new: true }
      );
      res.json(result);
    });

    // decrement 
    app.put('/products/:id/decrement', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productCollection.updateOne(
        query,
        { $inc: { quantity: -1 } },
        { new: true }
      );
      res.json(result);
    });





    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.log);


app.get('/', (req, res) => {
  res.send('inventory management is running..')
})

app.listen(port, () => {
  console.log(`inventory management is running on port ${port}`)
})