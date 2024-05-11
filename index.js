const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 1000;


//middleware
app.use(cors());
app.use(express.json());


console.log(process.env.DB_USER, process.env.DB_PASS)


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pg5idq6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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


        const foodCollections = client.db("foods").collection("food-collection");
        const requestFood = client.db("foods").collection("requestFood")


        app.post('/foods', async (req, res) => {
            const data = req.body;
            const result = await foodCollections.insertOne(data);
            res.send(result)
        })
        app.post('/request-food', async (req, res) => {
            const data = req.body;
            const result = await requestFood.insertOne(data);
            res.send(result)
        })

        //get data by status
        app.get('/foods', async (req, res) => {
            const status = req.query.status;
            // console.log(' const status = req.query.status;', status)
            let query = {};
            if (req.query?.status) {
                query = { status: status }
            }
            const result = await foodCollections.find(query).toArray();
            res.send(result)
        })


        app.get('/foods', async (req, res) => {
            const result = await foodCollections.find().toArray();
            res.send(result)
        })

        app.get("/foods/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await foodCollections.findOne(query);
            res.send(result)
        })

        //add new collection
        // app.post("/foods", async (req, res) => {
        //     const data = req.body;
        //     console.log('data from', server)
        //     const result = await requestFood.insertOne(data);
        //     res.send(result)
        // })

        app.delete("/foods/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await foodCollections.deleteOne(query);
            res.send(result)
        })



        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);





app.get('/', (req, res) => {
    res.send("Server is running")
});
app.listen(port, () => {
    console.log(`Server running port ${port}`)
})