const express = require('express')
require('dotenv').config();
const app = express()
const port = process.env.PORT || 3000;
const cors=require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(express.json())
app.use(cors())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.0twzmk2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    const bookDB = client.db("bookDB");
    const booksCollection = bookDB.collection("booksCollection");
    app.get('/books',async(req,res)=>{
        const query={}
        const cursor=booksCollection.find(query);
        const books= await cursor.toArray();
        res.send(books)
    })

    app.post('/books',async(req,res)=>{
        const books=req.body;
        const result=await booksCollection.insertOne(books);
        res.send(result)
    })

    app.get('/books/:id',async(req,res)=>{
      const id=req.params.id;
      const query={_id: new ObjectId(id)};
      const book=await booksCollection.findOne(query);
      res.send(book);
    })

    app.delete('/books/:id',async(req,res)=>{
      const id= req.params.id;
      const result= await booksCollection.deleteOne({_id: new ObjectId(id)});
      res.send(result);
    })
    
    console.log("MongoDB is connected");
  } finally {
  
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Server Connected')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})