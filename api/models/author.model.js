'use strict'
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const author = new Schema({
    name: {
        type: String,
        required: [true, "name can't be blank"],
        trim: true,
        unique: true
    },
});
module.exports = mongoose.model('author', author);