
require('dotenv').config();

const httpStatusText=require('./httpStatusText');

const express=require('express');
const cors=require('cors');
const app=express();
const path = require('path');

const mongoose=require('mongoose');
const url =process.env.MONGO_URL;
mongoose.connect(url)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error("MongoDB Connection Error:", err.message));


app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/test', (req, res) => {
  res.send('Server is working');
});

const authrouter = require('./Routes/auth.routes');

app.use('/api/auth', authrouter);


const userrouter = require('./Routes/user.routes');

app.use('/api/user', userrouter);


const productrouter = require('./Routes/product.routes');

app.use('/api/products', productrouter);

const orderrouter = require('./Routes/order.routes');

app.use('/api/order', orderrouter);

const cartrouter = require('./Routes/cart.routes');

app.use('/api/cart', cartrouter);

const categoryrouter = require('./Routes/category.routes');

app.use('/api/category', categoryrouter);

app.use((req, res) => {
  res.status(404).json({status:httpStatusText.ERROR,message:"This Resource Is Not Available"});
});

app.use((err, req, res, next) => {
  // If error was created by appError, use its properties; otherwise fallback
  const statusCode = err.statusCode || 500;
  const statusText = err.statusText || httpStatusText.ERROR;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    status: statusText,
    message: message,
    code: statusCode,
    data: null
  });
});


app.listen(process.env.PORT || 5000,()=>{
    console.log("Listening In Port 5000");
}); 


