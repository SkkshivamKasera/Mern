const mongoose = require('mongoose')

const connect = () => {
    mongoose.connect(process.env.CLOUD_MONGO).then((data)=>{
        console.log(`MongoDB connected with server : ${data.connection.host}`)
    })
}

module.exports = connect