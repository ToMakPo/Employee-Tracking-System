const mongoose = require('mongoose');
const db = require('./models');
await mongoose.connect('mongodb://localhost/my_database');