// server-mongo.js
const express = require("express");
const { MongoClient } = require("mongodb");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json()); // Supaya bisa terima JSON

// MongoDB connection
const MONGO_URI = "mongodb://192.168.229.129:27017"; // ganti sesuai bindIp VM
const client = new MongoClient(MONGO_URI);

let collection;

// Connect ke MongoDB saat server start
async function connectMongo() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db("kafka_data"); // nama database
    collection = db.collection("messages"); // nama collection
  } catch (err) {
    console.error("❌ Mongo connection error:", err);
  }
}

// Endpoint insert data
app.post("/insert", async (req, res) => {
  try {
    const data = req.body;
    if (!collection) return res.status(500).json({ error: "Mongo not connected" });

    const result = await collection.insertOne({ ...data, insertedAt: new Date() });
    res.json({ status: "ok", insertedId: result.insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Jalankan server
const PORT = 5009;
app.listen(PORT, () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  connectMongo();
});