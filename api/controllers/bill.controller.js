"use strict";
const bill = require("../models/bill.model");
const cart = require("../models/cart.model");
const randomstring = require("randomstring");
const nodemailer = require("../utils/nodemailer");
exports.addBill = async (req, res) => {
  const { id_user, address, total, phone, name, email } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (!id_user || !address || !phone || !name || !total || !email) {
    return res.status(422).json({ msg: "Invalid data: All fields are required" });
  }

  let cartFind = null;
  try {
    cartFind = await cart.findOne({ id_user });
  } catch (err) {
    console.error("Error finding cart:", err);
    return res.status(500).json({ msg: "Server error when finding cart" });
  }

  if (!cartFind) {
    return res.status(404).json({ msg: "User's cart not found" });
  }

  const token = randomstring.generate();

  // Gửi email xác nhận thanh toán (nếu cần)
  //let sendEmail = await nodemailer.sendMailConfirmPayment(email, token);
  //if (!sendEmail) {
    //return res.status(500).json({ msg: "Failed to send confirmation email" });
 // }

  const newBill = new bill({
    id_user,
    products: cartFind.products,
    address,
    phone,
    name,
    total,
    token,
  });

  try {
    // Xóa giỏ hàng sau khi tạo hóa đơn
    await cartFind.remove();
  } catch (err) {
    console.error("Error removing cart:", err);
    return res.status(500).json({ msg: "Failed to remove cart after creating bill" });
  }

  try {
    // Lưu hóa đơn
    await newBill.save();
    // await fetch('https://n8n.mitelai.com/webhook-test/10f0e712-80fb-4dc6-9bc0-2dc63fae1a0d', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     billId: newBill._id,
    //     userId: id_user,
    //     name,
    //     email,
    //     phone,
    //     address,
    //     total,
    //     products: cartFind.products,
    //     createdAt: new Date().toISOString()
    //   })
    // });
  } catch (err) {
    console.error("Error saving bill:", err);
    return res.status(500).json({ msg: "Failed to save bill" });
  }

  // Trả về phản hồi thành công
  res.status(201).json({ msg: "Bill created successfully" });
};

exports.verifyPayment = async (req, res) => {
  const token = req.params.token;
  if (!token) {
    return res.status(402).json({ msg: "!invalid" });
  }
  try {
     const tokenFind = await bill.findOne({token });
     if (!tokenFind) {
      return res.status(404).json({ msg: "not found!!!" });
    }
    await bill.findByIdAndUpdate(
      tokenFind._id,
      { $set: { issend: "99" } },
      { new: "99" }
    );
    res.status(200).json({ msg: "success!" })
  } catch (err) {
    return res.status(500).json({ msg:"server error", error: err.message });
  }
};

exports.getBillByIDUser = async (req, res) => {
  const { id_user } = req.params;
  // Kiểm tra xem id_user có tồn tại không
  if (!id_user) {
      return res.status(402).json({ msg: "Data invalid" });
  }
  try {
      // Tìm các hóa đơn của người dùng và sắp xếp theo ngày giảm dần
      const billFind = await bill
          .find({ id_user })
          .sort({ date: -1 });
      // Kiểm tra nếu không tìm thấy hóa đơn nào
      if (billFind.length === 0) {
          return res.status(404).json({ msg: "No bills found" });
      }
      // Trả về kết quả tìm thấy
      return res.status(200).json({ data: billFind });

  } catch (err) {
      console.error("Error in getBillByIDUser:", err);
      return res.status(500).json({ msg: "Server error" });
  }
};

exports.deleteBill = async (req, res) => {
  const { id } = req.params;

  // Kiểm tra nếu không có id trong params
  if (!id) {
    return res.status(400).json({ msg: "Data invalid: Bill ID is required" });
  }

  try {
    // Tìm hóa đơn với trạng thái 'issend' là "99"
    const billFind = await bill.findOne({ _id: id, issend: "99" });
    // Nếu không tìm thấy hóa đơn
    if (!billFind) {
      return res.status(404).json({ msg: "Bill not found or cannot be deleted" });
    }
    // Xóa hóa đơn
    await billFind.remove();
    res.status(200).json({ msg: "Bill deleted successfully" });
  } catch (err) {
    console.error("Error deleting bill:", err);
    res.status(500).json({ msg: "Server error while deleting bill" });
  }
};


exports.statisticalTop10 = async (req, res) => {
  let billFind = null;
  try {
    billFind = await bill.find({ issend: "1" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: err });
    return;
  }
  let arr = [];
  let len = billFind.length;
  for (let i = 0; i < len; i++) {
    let lenP = billFind[i].products.length;
    for (let j = 0; j < lenP; j++) {
      let index = arr.findIndex(
        (element) => billFind[i].products[j]._id === element._id
      );
      if (index === -1) {
        arr.push(billFind[i].products[j]);
      } else {
        arr[index].count += Number(billFind[i].products[j].count);
      }
    }
  }
  arr.sort(function (a, b) {
    return b.count - a.count;
  });
  res.status(200).json({ data: arr.length > 10 ? arr.slice(0, 10) : arr });
};
exports.statisticaRevenueDay = async (req, res) => {
  if (
    typeof req.body.day === "undefined" ||
    typeof req.body.month === "undefined" ||
    typeof req.body.year === "undefined"
  ) {
    return res.status(402).json({ msg: "data invalid" });
  }
  let { day, month, year } = req.body;
  let billFind = null;
  try {
    billFind = await bill.find({
      date: {
        $gte: new Date(year, month - 1, day),
        $lt: new Date(year, month - 1, parseInt(day) + 1),
      },
      issend: "1",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).msg({ msg: err });
  }
  res.status(200).json({ data: billFind });
};
exports.statisticaRevenueMonth = async (req, res) => {
  const { month, year } = req.body;
  if (!month || !year){
    return res.status(402).json({ msg: "data invalid" });
    
  }
  try {
    const billFind = await bill.find({
      date: {
        $gte: new Date(year, parseInt(month) - 1, 1),
        $lt: new Date(year, month, 1),
      },
      issend: "1",
    });
    return res.status(200).json({ data: billFind });
  } catch (err) {
    console.log("Error retrieving bills",err);
    return res.status(500).msg({ msg: err });
  }
};
exports.statisticaRevenueYear = async (req, res) => {
  const { year } = req.body;
  if (!year) {
    return res.status(402).json({ msg: "data invalid" });
  }
  try {
    const billFind = await bill.find({
      date: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(parseInt(year) + 1, 0, 1),
      },
      issend: "1",
    });
    return res.status(200).json({ data: billFind });
  } catch (err) {
    console.log(err);
    return res.status(500).msg({ msg: err });
    
  }
};
exports.statisticaRevenueQuauter = async (req, res) => {
  const { year, quarter } = req.body;
  if (!year || typeof quarter === "undefined") {
    return res.status(402).json({ msg: "Data invalid" });
  }
  if (quauter < 1 || quauter > 4) {
    return res.status(402).json({ msg: "data invalid" });
  }
  let start = 1,
    end = 4;
  if (parseInt(quauter) === 2) {
    start = 4;
    end = 7;
  }
  if (parseInt(quauter) === 3) {
    start = 7;
    end = 10;
  }
  if (parseInt(quauter) === 3) {
    start = 10;
    end = 13;
  }
  let billFind = null;
  try {
    billFind = await bill.find({
      date: {
        $gte: new Date(year, start - 1, 1),
        $lt: new Date(year, end - 1, 1),
      },
      issend: "1",
    });
  } catch (err) {
    console.log(err);
    res.status(500).msg({ msg: err });
    return;
  }
  res.status(200).json({ data: billFind });
};

exports.getBillNoVerify = async (req, res) => {
  try {
    const count = await bill.countDocuments({ issend: "99" });
    let totalPage = parseInt((count - 1) / 9 + 1);
    let { page } = req.params;
    if (parseInt(page) < 1 || parseInt(page) > totalPage) {
      res.status(200).json({ data: [], msg: "Invalid page", totalPage });
      return;
    }
    const docs = await bill
      .find({ issend: "99" })
      .skip(9 * (parseInt(page) - 1))
      .limit(9);
      res.status(200).json({ data: docs, totalPage });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: err || "Server error"});
  }
};

exports.getBillVerify = async (req, res) => {
  try {
    const count = await bill.countDocuments({ issend: "1" });
  let totalPage = parseInt((count - 1) / 9 + 1);
  let { page } = req.params;
  if (parseInt(page) < 1 || parseInt(page) > totalPage) {
    res.status(200).json({ data: [], msg: "Invalid page", totalPage });
    return;
  }
  const docs = await bill
    .find({ issend: "1" })
    .skip(9 * (parseInt(page) - 1))
    .limit(9)
    res.status(200).json({ data: docs, totalPage });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: err || "Server error"});
    return;
  }
};
exports.getProcessing = async (req, res) => {
  try {
    const count = await bill.countDocuments({ issend: "0" });
    let totalPage = parseInt((count - 1) / 9 + 1);
    let { page } = req.params;
    if (parseInt(page) < 1 || parseInt(page) > totalPage) {
      res.status(200).json({ data: [], msg: "Invalid page", totalPage });
      return;
    }
    const docs = await bill
      .find({ issend: "0" })
      .skip(9 * (parseInt(page) - 1))
      .limit(9)
      res.status(200).json({ data: docs, totalPage });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: err || "Server error"});
    return;
  }
};

exports.updateIssend = async (req, res) => {
  if (
    typeof req.body.name === "undefined" ||
    typeof req.body.id === "undefined"
  ) {
    res.status(422).json({ msg: "Invalid data" });
    return;
  }
  let id = req.body.id;
  let issend = req.body.name;
  let billFind;
  try {
    billFind = await bill.findById(id);
  } catch (err) {
    res.status(500).json({ msg: err });
    return;
  }
  if (billFind === null) {
    res.status(422).json({ msg: "not found" });
    return;
  }

  billFind.issend = issend;
  try {
    await billFind.save();
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: err });
    return;
  }
  res.status(201).json({ msg: "success", bill: { issend: issend } });
};
