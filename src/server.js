import express from 'express'

const app = express()

const HOST_NAME = 'localhost'

const PORT = 8080

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(PORT, HOST_NAME, () => {
  console.log(`Server is running at http://${HOST_NAME}:${PORT}`)
})
