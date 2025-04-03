"use strict";
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bill = new Schema({
  id_user: {
    type : String,
    // type: mongoose.Types.ObjectId,
    // ref: "user",
    required: [true, " id user can't be blank"],
    index: true
  },
  date: {
    type: Date,
    default: Date.now,
  },
  products: {
    type: [
      {
        id_category:{ 
          type : String,
          // type: mongoose.Types.ObjectId, 
          // ref: "category", index: true 
        },
        name: { type: String, trim: true },
        price: { type: Number, min: 0 },
        release_date: Date,
        img: { type: String, trim: true},
        describe: String,
        id_nsx:{
          type : String,
          // type: mongoose.Types.ObjectId, 
          // ref: "publisher" 
        },
        count: Number,
        _id:{
          type : String,
          //type: mongoose.Types.ObjectId 
        }
      }
    ],
    required: true,
    minlength: 1
  },
  total:{ type: Number, required: true, min: 0 },
  address: { type: String, required: true, trim: true },
  phone:{ type: String, required: true, trim: true, match: /^[0-9]{10,11}$/ },
  name: { type: String, required: true, trim: true },
  token: { type: String, trim: true },
  issend: {
    type: String,
    default: '99'
  }
});
module.exports = mongoose.model("bill", bill);
