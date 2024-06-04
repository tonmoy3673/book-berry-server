const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 3000;
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

// function verifyToken(req, res, next) {
//   const authHeader = req.headers.authorization;
//   console.log("Authorization Header:", authHeader);

//   if (!authHeader) {
//     return res.status(401).send({ message: "Unauthorized Access" });
//   }

//   const token = authHeader.split(" ")[1];

//   if (!token) {
//     return res.status(401).send({ message: "Unauthorized Access" });
//   }

//   jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
//     if (err) {
//       console.log("Token verification error:", err);
//       return res.status(403).send({ message: "Forbidden Access" });
//     } else {
//       console.log("Decoded Token:", decoded);
//       req.decoded = decoded;
//       next();
//     }
//   });
// }
const verifyJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('Authorization Header:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError(401, 'Access token not found, Please login, Again!');
    }

    const token = authHeader.split(' ')[1];
    console.log('Extracted Token:', token);

    const decoded = jwt.verify(token, process.env.JWT_SECRET_TOKEN);
    console.log('Decoded Token:', decoded);

    if (!decoded) {
      throw createError(401, 'Authorization failed to access data.');
    }

    req.decoded = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return next(error);
  }
};


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.0twzmk2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    const bookDB = client.db("bookDB");
    const booksCollection = bookDB.collection("booksCollection");
    const userCollection = bookDB.collection("userCollection");

    // ============ post user ===========//
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;

      // Validate email and user data here

      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);

      // JWT
      const token = jwt.sign(
        { email: user.email },
        process.env.JWT_SECRET_TOKEN,
        {
          expiresIn: "1d",
        }
      );

      res.status(200).send({ result, token });
    });

    // ============= get user ==========//
    app.get("/user/:email", verifyJWT, async (req, res) => {
      const decoded = req.decoded;
      const email = req.params.email;

      if (decoded.email !== email) {
        res.status(403).send({ message: "unauthorized access" });
      }
      const query = { email: email };

      const user = await userCollection.findOne(query);
      res.send(user);
    });

    app.get("/books", async (req, res) => {
      const query = {};
      const cursor = booksCollection.find(query);
      const books = await cursor.toArray();
      res.send(books);
    });

    app.post("/books", async (req, res) => {
      const books = req.body;
      const result = await booksCollection.insertOne(books);
      res.send(result);
    });

    app.get("/books/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const book = await booksCollection.findOne(query);
      res.send(book);
    });

    app.patch("/books/:id", async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      const result = await booksCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData }
      );
      res.send(result);
    });

    app.delete("/books/:id", async (req, res) => {
      const id = req.params.id;
      const result = await booksCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    console.log("MongoDB is connected");
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server Connected");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
