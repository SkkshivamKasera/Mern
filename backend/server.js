const express = require('express');
const dotenv = require('dotenv');
const connect = require('./config/database');
const body_parser = require('body-parser');
const cookie_parser = require('cookie-parser');
const cors = require('cors');
const errorMiddleWare = require('./middleware/error');
const cloudinary = require('cloudinary');
const fileUpload = require('express-fileupload');
const path = require("path")

const app = express();

dotenv.config({ path: './config/config.env' });

connect();

app.use(express.json());
app.use(cookie_parser());
app.use(body_parser.urlencoded({ extended: true }));
app.use(fileUpload());
app.use("*", cors({
  origin: true,
  credentials: true
}));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_APIKEY,
  api_secret: process.env.CLOUDINARY_APIKEY_SECRET,
});

const product = require('./routes/productRoutes');
const user = require('./routes/userRoutes');
const order = require('./routes/orderRouters');
const payment = require('./routes/paymentRouters')

app.use('/api/v1', product);
app.use('/api/v1', user);
app.use('/api/v1', order);
app.use('/api/v1', payment)

// The error handling middleware should be placed after all routes and middleware
app.use(errorMiddleWare);
app.use(express.static(path.join(__dirname, "../frontend/build")))

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../frontend/build/index.html"))
})

const server = app.listen(process.env.PORT, () => {
  console.log(`server running on http://localhost:${process.env.PORT}`);
});

// Rest of the code remains unchanged
process.on('unhandledRejection', (err) => {
  console.log(`Error: ${err.message}`);
  console.log('Shutting down the server due to unhandled promise rejection');
  server.close(() => {
    process.exit(1);
  });
});
