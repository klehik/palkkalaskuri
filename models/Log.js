const mongoose = require('mongoose')

const logSchema = new mongoose.Schema({
    converts: Number
  })



module.exports = mongoose.model("Log", logSchema);
