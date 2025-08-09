const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;
require("dotenv").config();
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@chicken-hub-personal.ri4zklf.mongodb.net/?retryWrites=true&w=majority&appName=Chicken-Hub-Personal`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const database = client.db("foodCollection");
    const usersCollection = database.collection("allFoods");

    app.get("/all-foods", async (req, res) => {
      const cursor = usersCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/all-foods/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: id };
      const result = await usersCollection.findOne(query);
      res.send(result);
    });

    app.get("/nearly-expired-foods", async (req, res) => {
      try {
        const allFoods = await usersCollection.find().toArray();
        const today = new Date();
        const fiveDaysFromNow = new Date();
        fiveDaysFromNow.setDate(today.getDate() + 5);
        const nearlyExpired = allFoods.filter((food) => {
          const exp = new Date(food.expireDate);
          return exp >= today && exp <= fiveDaysFromNow;
        });
        res.send(nearlyExpired);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch nearly expired foods" });
      }
    });

    app.get("/my-items", async (req, res) => {
      const email = req.query.email;
      if (!email) {
        return res.status(400).send({ message: "Email query is required" });
      }
      const result = await usersCollection.find({ userEmail: email }).toArray();
      res.send(result);
    });

    app.post("/all-foods", async (req, res) => {
      const newfood = req.body;
      const result = await usersCollection.insertOne(newfood);
      res.send(result);
    });

    app.put("/all-foods/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const user = req.body;
      const updatedInfo = {
        $set: {
          foodName: user.foodName,
          foodPhoto: user.foodPhoto,
          expireDate: user.expireDate,
          description: user.description,
          quantity: user.quantity,
          currentDate: user.currentDate,
          category: user.category,
        },
      };
      const result = await usersCollection.updateOne(filter, updatedInfo);
      res.send(result);
    });

    app.delete("/all-foods/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Chicken Hub server is active now...!");
});

app.listen(port, () => {
  console.log(`Chicken Hub server is running on port ${port}`);
});
