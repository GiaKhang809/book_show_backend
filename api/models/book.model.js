'use strict'
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const book = new Schema({
    id_category: {
        type : String,
        // type: mongoose.Types.ObjectId,
        // ref: "category",
        required: [true, "category can't be blank"],
        index: true,
    },
    name: {
        type: String,
        required: [true, "name can't be blank"],
        index: true, // tìm nhanh
    },
    price: {
        type: Number,
        required: [true, "price can't be blank"],
    },
    release_date: {
        type: Date,
        required: [true, "release date can't be blank"],
        default: new Date()
    },
    img: {
        type: String,
        required: [true, "img can't be blank"],
    },
    describe: {
        type: String, //mô tả
        default: "",
    },
    id_nsx: {
        type : String,
        // type: mongoose.Types.ObjectId,
        // ref: "publisher",
        required: [true, "id nsxnsx can't be blank"],
        index: true
    },
    id_author: {
        type : String,
        // type: mongoose.Types.ObjectId,
        // ref: "author",
        required: [true, "id authorauthor can't be blank"],
        index: true
    },
    view_counts: {
        type:Number,
        default: 0, 
        validate : {
            validator : Number.isInteger,
            message   : '{VALUE} is not an integer value'
          }
    },
    sales: {
        type: Number,
        default: 0,
        validate : {
            validator : Number.isInteger,
            message   : '{VALUE} is not an integer value'
        }
    }
});
module.exports = mongoose.model('book', book);