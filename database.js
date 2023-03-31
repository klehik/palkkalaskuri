const mongoose = require('mongoose')

const initDb = () => {
  const mongoDB = process.env.MONGO_URI
  mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true })
  const db = mongoose.connection
  db.on('error', console.error.bind(console, 'connection error:'))
  db.once('open', function () {
    console.log('Database converter7000 connected')
  })
}

exports.initDb = initDb
