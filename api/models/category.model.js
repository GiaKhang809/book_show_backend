'use strict'
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const category = new Schema({
    name: {
        type: String,
        required: [true, "name can't be blank"],
        unique: true,
        trim: true,
    },
});
module.exports = mongoose.model('category', category);