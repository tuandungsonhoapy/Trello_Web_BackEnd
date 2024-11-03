/* eslint-disable no-console */
import express from 'express'
import cors from 'cors'
import { connectDB, closeDB } from '~/config/mongodb'
import exitHook from 'async-exit-hook'
import { env } from '~/config/environment'
import { APIs_V1 } from '~/routes/v1'
import { errorHandlingMiddleware } from '~/middlewares/errorHandlingMiddleware'
import { corsOptions } from './config/cors'
import cookieParser from 'cookie-parser'
import http from 'http'
import socketIo from 'socket.io'
import { inviteUserToBoardSocket } from './sockets/inviteUserToBoardSocket'

const START_SERVER = () => {
  const app = express()

  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })

  // * Configuring the app to use middlewares
  app.use(cookieParser())

  app.use(cors(corsOptions))

  app.use(express.json())

  // * Configuring the app to use routes
  app.use('/api/v1', APIs_V1)

  // * Error handling middleware
  app.use(errorHandlingMiddleware)

  // * Configuring the app to use socket.io
  const server = http.createServer(app)
  const io = socketIo(server, { cors: corsOptions })
  io.on('connection', (client) => {
    inviteUserToBoardSocket(client)
  })

  if (env.BUILD_MODE === 'production') {
    server.listen(process.env.PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Server is running at port ${process.env.PORT}/api/v1`)
    })
  } else {
    server.listen(env.APP_PORT, env.APP_HOST, () => {
      // eslint-disable-next-line no-console
      console.log(
        `Server is running at http://${env.APP_HOST}:${env.APP_PORT}/api/v1`
      )
    })
  }

  // * Thực hiện cleanup khi server bị tắt
  exitHook(() => {
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
