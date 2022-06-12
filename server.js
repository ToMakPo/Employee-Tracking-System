require('dotenv').config()
const express = require('express')
const PORT = process.env.PORT || 3000

const app = express()
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.get('/', function (req, res) {
    res.send('Hello World')
})

const server = app.listen(PORT, () => {
    console.info(`App running on http://localhost:${PORT}`)
})