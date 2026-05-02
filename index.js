// require("dotenv").config();

// const express = require("express");
// const cors = require("cors");
// const mongoose = require("mongoose");
// const path = require("path");
// const cookieParser = require("cookie-parser");
// const httpStatusText = require("./httpStatusText");
// const i18n = require("./i18n.config");

// // Routes
// const languageRoutes = require("./Routes/language.routes");
// const authrouter = require("./Routes/auth.routes");
// const userrouter = require("./Routes/user.routes");
// const productrouter = require("./Routes/product.routes");
// const orderrouter = require("./Routes/order.routes");
// const cartrouter = require("./Routes/cart.routes");
// const categoryrouter = require("./Routes/category.routes");
// const dashboardRoutes = require("./Routes/dashboard.routes");
// const settingsroutes = require("./Routes/settings.route");
// const shippingRoutes = require("./Routes/shipping.route");

// const app = express();

// /* =========================
//    MONGODB CONNECTION (FIXED FOR VERCEL)
// ========================= */

// const MONGO_URL = process.env.MONGO_URL;

// let cached = global.mongoose;

// if (!cached) {
//   cached = global.mongoose = { conn: null, promise: null };
// }

// async function connectDB() {
//   if (cached.conn) return cached.conn;

//   if (!cached.promise) {
//     cached.promise = mongoose.connect(MONGO_URL).then((mongoose) => {
//       return mongoose;
//     });
//   }

//   cached.conn = await cached.promise;
//   return cached.conn;
// }

// connectDB();

// /* =========================
//    MIDDLEWARES
// ========================= */

// // CORS
// app.use(
//   cors({
//     origin: [
//       "http://localhost:3000",
//       "https://lilucky-front.vercel.app",
//       "https://lilucky-front-2xh4yuxyn-alaakamals-projects.vercel.app",
//       "https://lilucky-front-git-main-alaakamals-projects.vercel.app",
//     ],
//     credentials: true,
//   })
// );

// // Body parser
// app.use(express.json());

// // Cookies
// app.use(cookieParser());

// // Static files
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// // i18n
// app.use(i18n.init);

// /* =========================
//    ROUTES
// ========================= */

// app.use("/api", languageRoutes);
// app.use("/api/auth", authrouter);
// app.use("/api/user", userrouter);
// app.use("/api/products", productrouter);
// app.use("/api/order", orderrouter);
// app.use("/api/cart", cartrouter);
// app.use("/api/category", categoryrouter);
// app.use("/api/dashboard", dashboardRoutes);
// app.use("/api/shipping", shippingRoutes);
// app.use("/api/settings", settingsroutes);

// /* =========================
//    TEST ROUTES
// ========================= */

// app.get("/test", (req, res) => {
//   res.send("Server is working");
// });

// app.get("/", (req, res) => {
//   res.send("OK - Server Running");
// });

// /* =========================
//    404 HANDLER
// ========================= */

// app.use((req, res) => {
//   res.status(404).json({
//     status: httpStatusText.ERROR,
//     message: "This Resource Is Not Available",
//   });
// });

// /* =========================
//    GLOBAL ERROR HANDLER
// ========================= */

// app.use((err, req, res, next) => {
//   const statusCode = err.statusCode || 500;
//   const statusText = err.statusText || httpStatusText.ERROR;
//   const message = err.message || "Internal Server Error";

//   res.status(statusCode).json({
//     status: statusText,
//     message: message,
//     code: statusCode,
//     data: null,
//   });
// });

// /* =========================
//    START SERVER
// ========================= */

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });


require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const cookieParser = require("cookie-parser");
const httpStatusText = require("./httpStatusText");
const i18n = require("./i18n.config");

// Routes
const languageRoutes = require("./Routes/language.routes");
const authrouter = require("./Routes/auth.routes");
const userrouter = require("./Routes/user.routes");
const productrouter = require("./Routes/product.routes");
const orderrouter = require("./Routes/order.routes");
const cartrouter = require("./Routes/cart.routes");
const categoryrouter = require("./Routes/category.routes");
const dashboardRoutes = require("./Routes/dashboard.routes");
const settingsroutes = require("./Routes/settings.route");
const shippingRoutes = require("./Routes/shipping.route");

const app = express();

/* =========================
   DB CONNECTION (SAFE)
========================= */

const MONGO_URL = process.env.MONGO_URL;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  try {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
      cached.promise = mongoose.connect(MONGO_URL);
    }

    cached.conn = await cached.promise;
    console.log(" MongoDB Connected");

    return cached.conn;
  } catch (err) {
    console.log(" MongoDB Error:", err.message);
  }
}

connectDB();

/* =========================
   MIDDLEWARES
========================= */

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://lilucky-front.vercel.app",
      "https://lilucky-front-2xh4yuxyn-alaakamals-projects.vercel.app",
      "https://lilucky-front-git-main-alaakamals-projects.vercel.app",
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(i18n.init);

/* =========================
   REQUEST LOGGER (IMPORTANT)
========================= */

app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.originalUrl}`);
  next();
});

/* =========================
   ROUTES
========================= */

app.use("/api", languageRoutes);
app.use("/api/auth", authrouter);
app.use("/api/user", userrouter);
app.use("/api/products", productrouter);
app.use("/api/order", orderrouter);
app.use("/api/cart", cartrouter);
app.use("/api/category", categoryrouter);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/shipping", shippingRoutes);
app.use("/api/settings", settingsroutes);

/* =========================
   TEST ROUTES
========================= */

app.get("/test", (req, res) => {
  res.send("Server is working");
});

app.get("/", (req, res) => {
  res.send("OK - Server Running");
});

/* =========================
   404 HANDLER
========================= */

app.use((req, res) => {
  console.log("404 Not Found:", req.originalUrl);

  res.status(404).json({
    status: httpStatusText.ERROR,
    message: "This Resource Is Not Available",
  });
});

/* =========================
   GLOBAL ERROR HANDLER (FIXED)
========================= */

app.use((err, req, res, next) => {
  console.log(" GLOBAL ERROR CAUGHT");
  console.log("Name:", err.name);
  console.log("Message:", err.message);
  console.log("Stack:", err.stack);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    status: httpStatusText.ERROR,
    message: err.message || "Internal Server Error",
    code: statusCode,
  });
});

/* =========================
   START SERVER
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});