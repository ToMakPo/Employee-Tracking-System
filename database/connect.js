require('dotenv').config()
const mongoose = require('mongoose')
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost/employee'

mongoose.connection.on('connected', () => console.info('MongoDB has connected successfully'))
mongoose.connection.on('disconnected', () => console.info('MongoDB has disconnected successfully'))
mongoose.connection.on('error', err => console.error(err))

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

module.exports = require('./models')