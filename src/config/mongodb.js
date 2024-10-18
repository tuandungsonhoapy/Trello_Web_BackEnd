import { MongoClient, ServerApiVersion } from 'mongodb'
import { env } from '~/config/environment'

// * Khởi tạo đối tượng database
let trelloDBInstance = null

// * Khởi tạo đối tượng connection
const mongoClient = new MongoClient(env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  }
})

export const connectDB = async () => {
  // * Thực hiện kết đối đến mongodb
  await mongoClient.connect()

  trelloDBInstance = mongoClient.db(env.MONGODB_DB_NAME)
}

export const getDB = () => {
  if (!trelloDBInstance) {
    throw new Error('Must connect to database first!')
  }

  return trelloDBInstance
}

export const closeDB = async () => {
  await mongoClient.close()
}
