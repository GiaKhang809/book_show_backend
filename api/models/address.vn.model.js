'use strict'
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const addressvn = new Schema({
    city: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, unique: true, index: true },
    district: [
        {
            name: { type: String, trim: true },
            code: { type: String, trim: true, unique: true, index: true },
            ward: [
                {
                    name: { type: String, trim: true },
                    code: { type: String, trim: true, unique: true, index: true }
                }
            ]
        }
    ]
},
)
module.exports = mongoose.model('addressvn', addressvn);