import { MongoClient, type Db } from "mongodb";

let clientPromise: Promise<MongoClient> | null = null;

export function getMongoClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable. Set it in your .env file.");
  }
  if (!clientPromise) {
    const client = new MongoClient(uri);
    // Don't cache a rejected promise: if the first connect fails (bad URI, Atlas
    // IP block), a cached rejection would make every later request in this warm
    // instance fail identically until it cold-starts. Clear it so the next call retries.
    clientPromise = client.connect().catch((err) => {
      clientPromise = null;
      throw err;
    });
  }
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  const dbName = process.env.MONGODB_DB || "bharatpulse";
  return client.db(dbName);
}
