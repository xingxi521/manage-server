const mongoose = require('mongoose')
const userSchema = mongoose.Schema({
    "_id" : String,//唯一标识
    "currentIndex" : Number,//当前ID数
})

module.exports = mongoose.model("counter",userSchema,"counter")