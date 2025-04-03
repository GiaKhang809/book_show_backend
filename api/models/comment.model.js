'use strict'
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const comment = new Schema ({
    id_user: {
        type : String,
        // type: mongoose.Types.ObjectId,
        //  ref: "user" ,
        // default:'no_user'
    },
    id_book: {
        type : String,
        // type: mongoose.Types.ObjectId,
        // ref: "book" ,
        required: [true, "id book can't be blank"],
    },
    name: {
        type: String,
        required: [true, "name can't be blank"]
    },
    comment: {
        type: String,
        default: ""
    },
    date: {
        type: Date,
        default: Date.now
    }
});
module.exports = mongoose.model('comment', comment);