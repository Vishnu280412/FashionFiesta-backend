const express = require("express");
const env = require("./config/envConfig");
const cors = require("cors");
const connect = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const paymentRoutes = require("./routes/payment");
const orderRoutes = require("./routes/orderRoutes");
const userRolesRoute = require("./routes/userRolesRoute");
const app = express();

// database connection
connect();

app.use(cors());

app.post("/api/webhook", express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf.toString();
    },
}));

// middleware
app.use(express.json({limit: '50mb'}));

app.get("/", (req, res) => {
    res.json({msg: 'Welcome to Fashion Fiesta!!'});
});

// user routes
app.use('/api',userRoutes);
// category routes
app.use('/api', categoryRoutes);
// product routes
app.use('/api', productRoutes);
// payment routes
app.use('/api', paymentRoutes);
// order routes
app.use('/api', orderRoutes);
// user roles update routes
app.use('/api', userRolesRoute);

const port = env.PORT || 5000;

app.listen(port, () => {
    console.log(`Your server is running at port number: ${port}`);
});