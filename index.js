
// require('dotenv').config();

// const httpStatusText=require('./httpStatusText');

// const express=require('express');
// const cors=require('cors');
// const app=express();
// const path = require('path');
// const cookieParser = require('cookie-parser');
// const i18n = require('./i18n.config'); // import config
// const languageRoutes = require('./Routes/language.routes');


// const mongoose=require('mongoose');
// const url =process.env.MONGO_URL;
// mongoose.connect(url)
//   .then(() => console.log("MongoDB Connected"))
//   .catch(err => console.error("MongoDB Connection Error:", err.message));


// app.use(express.json());
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// app.use('/api', languageRoutes);

// app.get('/test', (req, res) => {
//   res.send('Server is working');
// });


// app.use(cors({
//   origin: 'http://localhost:3000',
//   credentials: true 
// }));


// const authrouter = require('./Routes/auth.routes');

// app.use('/api/auth', authrouter);


// const userrouter = require('./Routes/user.routes');

// app.use('/api/user', userrouter);


// const productrouter = require('./Routes/product.routes');

// app.use('/api/products', productrouter);

// const orderrouter = require('./Routes/order.routes');

// app.use('/api/order', orderrouter);

// const cartrouter = require('./Routes/cart.routes');

// app.use('/api/cart', cartrouter);

// const categoryrouter = require('./Routes/category.routes');

// app.use('/api/category', categoryrouter);

// app.use((req, res) => {
//   res.status(404).json({status:httpStatusText.ERROR,message:"This Resource Is Not Available"});
// });

// app.use((err, req, res, next) => {
//   // If error was created by appError, use its properties; otherwise fallback
//   const statusCode = err.statusCode || 500;
//   const statusText = err.statusText || httpStatusText.ERROR;
//   const message = err.message || "Internal Server Error";

//   res.status(statusCode).json({
//     status: statusText,
//     message: message,
//     code: statusCode,
//     data: null
//   });
// });

// app.get('/', (req, res) => {
//   res.send(`<h1>${res.__('welcome')}</h1>`);
// });

// app.listen(process.env.PORT || 5000,()=>{
//     console.log("Listening In Port 5000");
// }); 


require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const cookieParser = require('cookie-parser');
const httpStatusText = require('./httpStatusText');
const i18n = require('./i18n.config');

// Routes
const languageRoutes = require('./Routes/language.routes');
const authrouter = require('./Routes/auth.routes');
const userrouter = require('./Routes/user.routes');
const productrouter = require('./Routes/product.routes');
const orderrouter = require('./Routes/order.routes');
const cartrouter = require('./Routes/cart.routes');
const categoryrouter = require('./Routes/category.routes');
const dashboardRoutes = require("./Routes/dashboard.routes");


const app = express();

/* =========================
   DATABASE CONNECTION
========================= */
const url = process.env.MONGO_URL;

mongoose.connect(url)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error("MongoDB Connection Error:", err.message));

/* =========================
   MIDDLEWARES (IMPORTANT ORDER)
========================= */

// CORS
app.use(cors({
  origin: 'https://lilucky-front.vercel.app/customer',
  credentials: true
}));

// Body parser
app.use(express.json());

// Cookies
app.use(cookieParser());

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// i18n middleware
app.use(i18n.init);

/* =========================
   ROUTES
========================= */

app.use('/api', languageRoutes);
app.use('/api/auth', authrouter);
app.use('/api/user', userrouter);
app.use('/api/products', productrouter);
app.use('/api/order', orderrouter);
app.use('/api/cart', cartrouter);
app.use('/api/category', categoryrouter);
app.use("/api/dashboard", dashboardRoutes);

// test route
app.get('/test', (req, res) => {
  res.send('Server is working');
});

// root route
app.get('/', (req, res) => {
  res.send('OK - Server Running');
});

/* =========================
   404 HANDLER
========================= */
app.use((req, res) => {
  res.status(404).json({
    status: httpStatusText.ERROR,
    message: "This Resource Is Not Available"
  });
});

/* =========================
   GLOBAL ERROR HANDLER
========================= */
app.use((err, req, res, next) => {
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

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});