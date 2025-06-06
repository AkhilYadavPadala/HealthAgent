import { MongoClient, GridFSBucket } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

let db;
let gfs;
const url = process.env.MONGODB_URI;

async function connectToDB(callback) {
  try {
    const client = new MongoClient(url);
    await client.connect();
    db = client.db("healthcare");

    // ✅ Initialize GridFS immediately after connecting to MongoDB
    gfs = new GridFSBucket(db, { bucketName: "uploads" });

    console.log("✅ Connected to MongoDB & GridFS Initialized");

    callback();
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error);
    process.exit(1);
  }
}

function getDB() {
  if (!db) throw new Error("❌ Database not connected!");
  return db;
}

function getGFS() {
  if (!gfs) throw new Error("❌ GridFSBucket not initialized!");
  return gfs;
}

export { connectToDB, getDB, getGFS };
