/* eslint-disable no-console */
import express from 'express'
import { connectDB, closeDB } from '~/config/mongodb'
import exitHook from 'async-exit-hook'
import { env } from '~/config/environment'
import { APIs_V1 } from '~/routes/v1'

const START_SERVER = () => {
  const app = express()

  app.use(express.json())

  app.use('/api/v1', APIs_V1)

  app.listen(env.APP_PORT, env.APP_HOST, () => {
    // eslint-disable-next-line no-console
    console.log(
      `Server is running at http://${env.APP_HOST}:${env.APP_PORT}/api/v1`
    )
  })

  // * Thực hiện cleanup khi server bị tắt
  exitHook(() => {
    process.stdin.resume()
    console.log('Cleaning up...')
    closeDB() // Close the database connection
    console.log('Cleanup complete.')
  })
}

;(async () => {
  try {
    await connectDB()
    console.log('Connected to MongoDB successfully!')
    START_SERVER()
  } catch (error) {
    console.error('Error connecting to MongoDB:', error)
    process.exit(0)
  }
})()
