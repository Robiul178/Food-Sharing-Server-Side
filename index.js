const express = require('express');
const cors = require('cors');
let jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 1000;

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


//middleware
app.use(cors({
    origin: [
        'http://127.0.0.1:5173',
        'https://mealforheal.netlify.app',
    ],
    credentials: true
}));
app.use(express.json());

app.use(cookieParser());


const verifyToken = (req, res, next) => {
    const token = req.cookies.token
    // console.log('token in the middlewafe', token)
    if (!token) {
        return res.status(401).send({ message: ' unauthorized access' })
    }
    jwt.verify(token, process.env.ACCESS_SECRET_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: ' unauthorized access' })
        }
        req.user = decoded;
        next()
    })

}


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
        // await client.connect();

        const foodCollections = client.db("foods").collection("food-collection");
        const requestFood = client.db("foods").collection("requestFood")

        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_SECRET_TOKEN, { expiresIn: '1h' });
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            }).send({ success: true })
        });

        app.post("/log-out", async (req, res) => {
            const user = req.body;
            res.clearCookie('token', { maxAge: 0 }).send({ success: true })
        })

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


        ///payment intent
        app.post("/create-payment-intent", async (req, res) => {
            const { price } = req.body;
            const ammount = parseInt(price * 100);

            const paymentIntent = await stripe.paymentIntents.create({
                amount: ammount,
                currency: "usd",
                payment_method_types: ["card"]
            });
            res.send({
                clientSecret: paymentIntent.client_secret
            })
        })



        //my added food
        app.get('/food/:email', async (req, res) => {

            const email = req.params.email;
            const query = { 'donator.email': email };
            const result = await foodCollections.find(query).toArray()
            res.send(result)
        })

        //get food by id
        app.get('/foods/:id', async (req, res) => {

            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await foodCollections.findOne(query);
            res.send(result)
        })


        //get data by status
        app.get('/foods', async (req, res) => {

            const status = req.query.status;
            let query = {};
            if (req.query?.status) {
                query = { status: status }
            }
            const result = await foodCollections.find(query).toArray();
            res.send(result)
        })


        ///get
        app.get('/foods', async (req, res) => {
            const result = await foodCollections.find().toArray();
            res.send(result)
        })
        app.get('/food', async (req, res) => {
            const result = await foodCollections.find().toArray();
            res.send(result)
        })

        app.get('/request-food', async (req, res) => {
            const result = await requestFood.find().toArray();
            res.send(result)
        })

        //manage food reguest
        app.get('/request-food/:email', verifyToken, async (req, res) => {

            const email = req.params.email;
            const tokenEmail = req.user.email;

            if (tokenEmail !== email) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const query = {
                user_email: email
            };
            const result = await requestFood.find(query).toArray()
            res.send(result)
        })


        //update
        app.put("/foods/:id", async (req, res) => {
            const id = req.params.id;
            const foodData = req.body;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updateFood = {
                $set: {
                    ...foodData
                }
            }

            const result = await foodCollections.updateOne(filter, updateFood, options)
            res.send(result)
        })


        app.delete("/foods/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await foodCollections.deleteOne(query);
            res.send(result)
        })



        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
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