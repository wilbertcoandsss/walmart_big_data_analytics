const { Kafka } = require("kafkajs");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const neo4j = require("neo4j-driver");

const BROKER = "192.168.229.129:9092";
const TOPIC = "walmart_testing";
const MONGO_URI = "mongodb://192.168.229.129:27017";
const DB_NAME = "kafka_data";
const COLLECTION_NAME = "messages";

const kafka = new Kafka({
  clientId: "node-app",
  brokers: [BROKER],
});

const driver = neo4j.driver(
  "neo4j://127.0.0.1:7687",
  neo4j.auth.basic("neo4j", "neo4j123")
);


const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "testing-group-" + Date.now() });

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors({
  origin: "http://10.35.148.59:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));
app.use(express.json());

// === MongoDB ===
const client = new MongoClient(MONGO_URI);
let collection;

async function connectMongo() {
  await client.connect();
  const db = client.db(DB_NAME);
  collection = db.collection(COLLECTION_NAME);
  console.log("✅ Connected to MongoDB");
}

// === Helper ===
function formatTimestamp(date) {
  const pad = (n) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} `
    + `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

// === Socket.IO ===
const onlineUsers = {};
const productCounts = {};
const checkoutCounts = {};

io.on("connection", async (socket) => {
  console.log("🟢 Client connected:", socket.id);

  // When a user logs in, they should emit this event with their username
  socket.on("user_online", (username) => {
    onlineUsers[socket.id] = username;
    // Broadcast the updated list to ALL clients
    io.emit("update_online_users", Object.values(onlineUsers));
    console.log(`👤 ${username} is online. Total online: ${Object.keys(onlineUsers).length}`);
  });

  // Kirim semua pesan yang tersimpan di MongoDB (history)
  if (collection) {
    const history = await collection.find().sort({ _id: 1 }).toArray();
    socket.emit("all_messages", history);
    console.log(`📤 Sent ${history.length} history messages`);
  }

  socket.on("send_chat_message", async (messageText) => {
    const sender = onlineUsers[socket.id] || "Anonymous"; // Dapatkan username pengirim

    // Siapkan payload untuk dikirim ke Kafka
    const messagePayload = {
      event: "USER_CHAT",
      user: sender,
      message: messageText,
    };

    // Kirim pesan ke Kafka
    try {
      await producer.send({
        topic: TOPIC,
        messages: [{ value: JSON.stringify(messagePayload) }],
      });
      console.log(`💬 Chat from ${sender} sent to Kafka`);
    } catch (err) {
      console.error("❌ Failed to send chat message to Kafka", err);
    }
    // Consumer yang sudah ada akan otomatis mengambil dan menyiarkan pesan ini ke semua orang
  });

  socket.emit("welcome", { msg: "Connected to Kafka Realtime Stream" });

  socket.on("disconnect", () => {
    const disconnectedUser = onlineUsers[socket.id];
    delete onlineUsers[socket.id];
    // Broadcast the updated list to ALL clients
    io.emit("update_online_users", Object.values(onlineUsers));
    console.log(`🔴 Client ${disconnectedUser || socket.id} disconnected. Total online: ${Object.keys(onlineUsers).length}`);
  });
});

// === Kafka Consumer ===
async function runKafkaConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: TOPIC, fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      let msgValue = message.value.toString();
      let parsed;
      try {
        parsed = JSON.parse(msgValue);
      } catch {
        parsed = { msg: msgValue };
      }

      // --- Analysis for "Add to Cart" (Trending) ---
            if (parsed.event === 'ADD_TO_CART' && parsed.product) {
                const productName = parsed.product;
                productCounts[productName] = (productCounts[productName] || 0) + 1;

                const top5Products = Object.entries(productCounts)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([name, count]) => ({ name, count }));

                io.emit("update_trending_products", top5Products);
                console.log("📊 Updated Trending Products:", top5Products);
            }

            // ✅ NEW: Analysis for "Checkout" ---
            if (parsed.event === 'CHECKOUT' && Array.isArray(parsed.products)) {
                // Iterate over all products in the checkout cart
                parsed.products.forEach(product => {
                    const productName = product.name;
                    // Add the quantity of the product to the checkout counter
                    checkoutCounts[productName] = (checkoutCounts[productName] || 0) + product.quantity;
                });

                // Get Top 5 most checked-out products
                const top5Checkout = Object.entries(checkoutCounts)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([name, count]) => ({ name, count }));

                // Broadcast the new checkout trend data on a new event
                io.emit("update_checkout_trends", top5Checkout);
                console.log("🛒 Updated Top Checkout Products:", top5Checkout);
            }

      const doc = { ...parsed, insertedAt: formatTimestamp(new Date()) };
      console.log("📩 Received from Kafka:", doc);

      // Simpan ke MongoDB
      if (collection) await collection.insertOne(doc);

      // Kirim langsung ke semua client
      io.emit("receive_message", doc);
    },
  });

  console.log("✅ Kafka consumer running (from beginning)");
}

// === Endpoint kirim ke Kafka ===
app.post("/send_to_kafka", async (req, res) => {
  try {
    const data = req.body;
    await producer.connect();
    await producer.send({
      topic: TOPIC,
      messages: [{ value: JSON.stringify(data) }],
    });
    console.log("✅ Sent to Kafka:", data);
    res.json({ status: "ok" });
  } catch (err) {
    console.error("❌ Kafka send error:", err);
    res.status(500).json({ error: "Failed to send to Kafka" });
  }
});

// Di dalam file server.js

app.get("/graph/market-basket", async (req, res) => {
  const session = driver.session();
  try {
    const query = `
      MATCH (p1:Product)<-[:CONTAINS_PRODUCT]-(:TransactionDetail)<-[:HAS_DETAIL]-(t:TransactionHeader)-[:HAS_DETAIL]->(:TransactionDetail)-[:CONTAINS_PRODUCT]->(p2:Product)
      WHERE id(p1) < id(p2)
      RETURN p1.product_name AS product1, p2.product_name AS product2, count(t) AS frequency
      ORDER BY frequency DESC
      LIMIT 10
    `;
    const result = await session.run(query);

    const nodes = [];
    const edges = [];
    const nodeSet = new Set();

    result.records.forEach(record => {
      const p1 = record.get("product1");
      const p2 = record.get("product2");
      const freq = record.get("frequency").toNumber();

      if (!nodeSet.has(p1)) { nodes.push({ id: p1, label: p1, group: "Product" }); nodeSet.add(p1); }
      if (!nodeSet.has(p2)) { nodes.push({ id: p2, label: p2, group: "Product" }); nodeSet.add(p2); }

      edges.push({
        id: `${p1}-${p2}`, 
        from: p1,
        to: p2,
        label: `Bought Together: ${freq} times`
      });
    });

    res.json({ nodes, edges });
  } finally {
    await session.close();
  }
});

app.get("/graph/loyal-customers", async (req, res) => {
  const session = driver.session();
  try {
    const query = `
      MATCH (c:Customer {churn: 'No'})-[:MADE_TRANSACTION]->(:TransactionHeader)-[:HAS_DETAIL]->(:TransactionDetail)-[:CONTAINS_PRODUCT]->(p:Product)
      RETURN p.product_name AS productName, count(*) AS purchaseCount
      ORDER BY purchaseCount DESC
      LIMIT 10
    `;
    const result = await session.run(query);

    const nodes = [{ id: "loyal_customers", label: "Loyal Customers", group: "Segment" }];
    const edges = [];
    const nodeSet = new Set("loyal_customers");

    result.records.forEach(record => {
      const product = record.get("productName");
      const count = record.get("purchaseCount").toNumber();
      
      if (!nodeSet.has(product)) {
        nodes.push({ id: product, label: product, group: "Product" });
        nodeSet.add(product);
      }
      edges.push({ from: "loyal_customers", to: product, label: `${count} purchases` });
    });

    res.json({ nodes, edges });
  } finally {
    await session.close();
  }
});

app.get("/graph/vip-customers", async (req, res) => {
  const session = driver.session();
  try {
    const query = `
      MATCH (c:Customer)-[:MADE_TRANSACTION]->(:TransactionHeader)-[:HAS_DETAIL]->(d:TransactionDetail)
      WITH c, sum(d.total_spend) AS totalSpend
      ORDER BY totalSpend DESC
      LIMIT 5
      MATCH (c)-[:MADE_TRANSACTION]->(:TransactionHeader)-[:HAS_DETAIL]->(:TransactionDetail)-[:CONTAINS_PRODUCT]->(p:Product)
      RETURN c.customer_id AS customerId, totalSpend, collect(DISTINCT p.product_name) AS favoriteProducts
    `;
    const result = await session.run(query);

    const nodes = [];
    const edges = [];
    const nodeSet = new Set();

    result.records.forEach(record => {
      const customer = record.get("customerId");
      const spend = record.get("totalSpend").toFixed(2);
      const products = record.get("favoriteProducts");

      if (!nodeSet.has(customer)) {
        nodes.push({ id: customer, label: `${customer}\n($${spend})`, group: "VIP Customer" });
        nodeSet.add(customer);
      }
      
      products.forEach(p => {
        if (!nodeSet.has(p)) {
          nodes.push({ id: p, label: p, group: "Product" });
          nodeSet.add(p);
        }
        edges.push({ from: customer, to: p });
      });
    });

    res.json({ nodes, edges });
  } finally {
    await session.close();
  }
});

app.get("/graph/churn-products", async (req, res) => {
  const session = driver.session();
  try {
    const query = `
      MATCH (c:Customer {churn: 'Yes'})-[:MADE_TRANSACTION]->(:TransactionHeader)-[:HAS_DETAIL]->(:TransactionDetail)-[:CONTAINS_PRODUCT]->(p:Product)
      RETURN p.product_name AS productName, count(*) AS purchaseCount
      ORDER BY purchaseCount DESC
      LIMIT 10
    `;
    const result = await session.run(query);

    const nodes = [{ id: "churned_customers", label: "Churned Customers", group: "Segment" }];
    const edges = [];
    const nodeSet = new Set("churned_customers");

    result.records.forEach(record => {
      const product = record.get("productName");
      const count = record.get("purchaseCount").toNumber();
      
      if (!nodeSet.has(product)) {
        nodes.push({ id: product, label: product, group: "Product" });
        nodeSet.add(product);
      }
      edges.push({ from: "churned_customers", to: product, label: `${count} purchases` });
    });

    res.json({ nodes, edges });
  } finally {
    await session.close();
  }
});

app.get("/graph/location-category", async (req, res) => {
  const session = driver.session();
  try {
    const query = `
      MATCH (c:Customer)-[:MADE_TRANSACTION]->(:TransactionHeader)-[:HAS_DETAIL]->(:TransactionDetail)-[:CONTAINS_PRODUCT]->(p:Product)
      RETURN c.location AS location, p.product_category AS category, count(*) AS purchaseCount
      ORDER BY location, purchaseCount DESC
    `;
    const result = await session.run(query);

    const nodes = [];
    const edges = [];
    const nodeSet = new Set();
    const locationData = {}; // Untuk mengelompokkan data per lokasi

    // Kelompokkan data
    result.records.forEach(record => {
      const location = record.get("location");
      const category = record.get("category");
      const count = record.get("purchaseCount").toNumber();
      if (!locationData[location]) locationData[location] = [];
      locationData[location].push({ category, count });
    });

    // Proses untuk graf (ambil top N per lokasi)
    const topN = 3; // Ambil 3 kategori teratas per lokasi
    Object.keys(locationData).forEach(location => {
      if (!nodeSet.has(location)) { nodes.push({ id: location, label: location, group: "Location" }); nodeSet.add(location); }
      
      locationData[location].slice(0, topN).forEach(item => {
        if (!nodeSet.has(item.category)) { nodes.push({ id: item.category, label: item.category, group: "Category" }); nodeSet.add(item.category); }
        edges.push({ from: location, to: item.category, label: `${item.count} purchases` });
      });
    });

    res.json({ nodes, edges });
  } finally {
    await session.close();
  }
});

app.get("/graph/product-connections", async (req, res) => {
  const session = driver.session();
  try {
    // Query yang lebih spesifik: TransactionDetail -> CONTAINS_PRODUCT -> Product
    const query = `
      MATCH p=(td:TransactionDetail)-[r:CONTAINS_PRODUCT]->(prod:Product)
      RETURN p
      LIMIT 500
    `;
    const result = await session.run(query);

    const nodes = [];
    const edges = [];
    const nodeSet = new Set(); // Untuk melacak node unik

    result.records.forEach(record => {
      const path = record.get("p");
      
      // Path hanya punya satu segmen: TransactionDetail -> Product
      const tdNode = path.start; // Node TransactionDetail
      const prodNode = path.end;  // Node Product
      const relationship = path.segments[0].relationship; // Relasi CONTAINS_PRODUCT

      // Tambahkan node TransactionDetail jika belum ada
      if (!nodeSet.has(tdNode.identity.low)) { // Gunakan ID internal Neo4j
        nodes.push({ 
          id: tdNode.identity.low, 
          label: `Detail: ${tdNode.properties.detail_id.substring(0, 8)}...`, // Label singkat
          group: "TransactionDetail", // Grup untuk styling
          title: `Detail ID: ${tdNode.properties.detail_id}\nQty: ${tdNode.properties.quantity}\nSpend: $${tdNode.properties.total_spend}` // Tooltip
        });
        nodeSet.add(tdNode.identity.low);
      }
      
      // Tambahkan node Product jika belum ada
      if (!nodeSet.has(prodNode.identity.low)) {
        nodes.push({ 
          id: prodNode.identity.low, 
          label: prodNode.properties.product_name,
          group: "Product",
          title: `ID: ${prodNode.properties.product_id}\nCategory: ${prodNode.properties.product_category}`
        });
        nodeSet.add(prodNode.identity.low);
      }

      // Tambahkan edge (relasi)
      edges.push({
        id: relationship.identity.low, // ID unik relasi
        from: tdNode.identity.low,
        to: prodNode.identity.low,
        label: relationship.type // Label relasi: "CONTAINS_PRODUCT"
      });
    });

    res.json({ nodes, edges });
  } catch (err) {
    console.error("Error fetching product connections:", err);
    res.status(500).json({ error: "Neo4j query failed" });
  } finally {
    await session.close();
  }
});

// Di dalam file server.js Anda

app.post("/graph/create-projection", async (req, res) => {
  const session = driver.session();
  // Anda bisa membuat nama graf dinamis jika perlu, tapi statis juga oke
  const graphName = 'ProductPurchaseGraph'; 

  try {
    // Pastikan graf dengan nama yang sama dihapus dulu agar tidak error
    await session.run(`CALL gds.graph.drop($graphName, false)`, { graphName });

    // Jalankan query project
    const query = `
      CALL gds.graph.project(
        $graphName, // Gunakan parameter $graphName
        { // Proyeksi Node
          Product: { label: 'Product' },
          TransactionDetail: { label: 'TransactionDetail' }
        },
        { // Proyeksi Relationship
          CONTAINS_PRODUCT: {
            type: 'CONTAINS_PRODUCT',
            orientation: 'REVERSE' // Dari Product KE TransactionDetail (untuk in-degree Product)
          }
        }
      )
      YIELD graphName, nodeCount, relationshipCount
      RETURN graphName, nodeCount, relationshipCount
    `;
    const result = await session.run(query, { graphName });

    if (result.records.length === 0) {
        throw new Error("Graph projection failed to create.");
    }

    const projectionResult = result.records[0].toObject();
    
    // Konversi nilai BigInt (jika ada) ke Number agar aman untuk JSON
    projectionResult.nodeCount = projectionResult.nodeCount.toNumber ? projectionResult.nodeCount.toNumber() : projectionResult.nodeCount;
    projectionResult.relationshipCount = projectionResult.relationshipCount.toNumber ? projectionResult.relationshipCount.toNumber() : projectionResult.relationshipCount;


    console.log("✅ Graph projection created:", projectionResult);
    res.json({ 
      status: "OK", 
      message: `Graph projection '${projectionResult.graphName}' created successfully.`,
      details: projectionResult 
    });

  } catch (err) {
    console.error("❌ Error creating graph projection:", err);
    res.status(500).json({ error: "Neo4j GDS graph projection failed", details: err.message });
  } finally {
    await session.close();
  }
});

// Jangan lupa endpoint untuk menghapus projection saat tidak dibutuhkan
app.delete("/graph/delete-projection/:graphName", async (req, res) => {
    const session = driver.session();
    const graphName = req.params.graphName;
    try {
        await session.run(`CALL gds.graph.drop($graphName, false)`, { graphName });
        console.log(`🧹 Graph projection '${graphName}' dropped.`);
        res.json({ status: "OK", message: `Graph projection '${graphName}' dropped.` });
    } catch (err) {
         console.error(`❌ Error dropping graph projection ${graphName}:`, err);
        res.status(500).json({ error: "Failed to drop graph projection", details: err.message });
    } finally {
        await session.close();
    }
});

// === Jalankan Server ===
server.listen(5001, async () => {
  console.log("🚀 Server running on http://0.0.0.0:5001");
  await connectMongo();
  await runKafkaConsumer();
});
