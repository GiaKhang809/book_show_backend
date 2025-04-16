'use strict'
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cart = new Schema ({
    id_user: {
        type : String,
        // type: mongoose.Types.ObjectId,
        // ref: "user",
        required: true,
        index: true,
    },
    date: {
        type: Date,
        default: new Date()
    },
    products: {
        type: [
            {
                id_category: { 
                    type : String,
                    // type: mongoose.Types.ObjectId, ref: "category" 
                },
                name: { type: String, required: true, trim: true },
                price: { type: Number, required: true, min: 0 },
                release_date: Date,
                img: { type: String, required: true },
                describe: String, 
                id_nsx:{ 
                    type : String,
                    // type: mongoose.Types.ObjectId, ref: "publisher" 
                },
                count: { type: Number, required: true },
                _id: { 
                    type : String,
                    // type: mongoose.Types.ObjectId, required: true 
                },
                describe: {
                    type: String, //mô tả
                    default: "",
                }
            }
        ],
        required : true,
        minlength: 1,
    },
})

module.exports = mongoose.model('cart', cart);