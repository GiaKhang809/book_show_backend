const express = require('express');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 8080;
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const userRouter = require('./api/routers/user.router');
const categoryRouter = require('./api/routers/category.router');
const publisherRouter = require('./api/routers/publisher.router');
const bookRouter = require('./api/routers/book.router');
const authorRouter = require('./api/routers/author.router');
const commentRouter = require('./api/routers/comment.router');
const billRouter = require('./api/routers/bill.router');
const cartRouter = require('./api/routers/cart.router');
const adminRouter = require('./api/routers/admin.router');
const addressVnRouter = require('./api/routers/addres.vn.router');
//mongoose.Promise = global.Promise;
//mongoose.connect('mongodb://127.0.0.1:27017/BookShop');
// Kết nối MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB connection error:", err));

const address = require('./api/models/address.vn.model');
const test = () => {
    try {
        Object.keys(data).forEach(function (k) {
            let _dic = [];
            let _ward = [];
            Object.keys(data[k].district).forEach(function (j) {
                Object.keys(data[k].district[j].ward).forEach(function (l) {
                    _ward.push({
                        name: data[k].district[j].ward[l].name,
                        code: data[k].district[j].ward[l].code,
                    });
                });
                _dic.push({
                    name: data[k].district[j].name,
                    code: data[k].district[j].code,
                    ward: _ward
                });

            });
            const new_address = new address({
                city: data[k].name,
                district: _dic,
                code: data[k].code
            });
            new_address.save()
                .then(() => console.log("Saved successfully:", new_address))
                .catch(err => console.log("Error saving address:", err));
            // try {
            //     new_address.save()
            // }
            // catch(Err) {
            //     console.log(Err)
            // }
        });
    } catch (err) {
        console.log("Error processing data:", err);
    }
}
// test();
// Middleware`phần mềm trung giangian`
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }));
app.use(cors())
// Import routers
userRouter(app);
categoryRouter(app);
publisherRouter(app);
bookRouter(app);
authorRouter(app);
commentRouter(app)
billRouter(app);
cartRouter(app);
adminRouter(app);
addressVnRouter(app);
// Route favicon để tránh lỗi "Cannot GET /favicon.ico"
app.get('/', (req, res) => { res.send('welcome to book shopshop') })
// Khởi động server
app.listen(port, () => console.log("server running on port " + port));