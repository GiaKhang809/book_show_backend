"use strict";
const user = require("../models/user.model");
const nodemailer = require("../utils/nodemailer");
const randomstring = require("randomstring");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const otp = require("../utils/otp");

exports.register = async (req, res) => {
  let { email, password, firstName, lastName, address, phone_number } = req.body;
   // Kiểm tra dữ liệu thiếu
   if (!email || !password || !firstName || !lastName || !address || !phone_number) {
    return res.status(422).json({ msg: "Invalid data" });
  }
  // Kiểm tra email và password
  if ((email.indexOf("@") === -1 || email.indexOf(".") === -1) || password.length < 6) {
    return res.status(422).json({ msg: "Invalid data" });
  }
  try {
    const userFind = await user.findOne({ email: email });
    if(userFind){
      return res.status(409).json({msg: "Email already exist"})
    }
    //  const token = jwt.sign(
    //   { email },
    //   process.env.JWT_SECRET || "shhhhh",
    //   { expiresIn: "1h" }
    // );
    const token = randomstring.generate();
    const sendEmail = await nodemailer.sendEmail(email, token);
    if (!sendEmail) {
      return res.status(500).json({ msg: 'Send email fail' });
    }
    password = bcrypt.hashSync(password, 10);
    const newUser = new user({
      email: email,
      firstName: firstName,
      lastName: lastName,
      password: password,
      address: address,
      phone_number: phone_number,
      token: token,
    });
    await newUser.save();

    await fetch('https://n8n.mitelai.com/webhook-test/574d6e5c-2fa5-4548-870b-e6d9273e8550', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'new_user_created',
        user: {
          id: newUser._id,
          email,
          name: `${firstName} ${lastName}`,
          address,
          phone_number,
          is_admin: false,
          createdAt: new Date().toISOString(),
          token: token // Gửi luôn token về n8n
        }
      })
    });
    return res.status(201).json({ msg: "success" });

  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ msg: "Internal server error", error: err.message });
  }
};

exports.verifyAccount = async (req, res) => {
  if (typeof req.params.token === "undefined") {
    res.status(402).json({ msg: "!invalid" });
    return;
  }
  let token = req.params.token;
  let tokenFind = null;
  try {
    tokenFind = await user.findOne({ token: token });
  } catch (err) {
    res.status(500).json({ msg: err });
    return;
  }
  if (tokenFind == null) {
    res.status(404).json({ msg: "not found!!!" });
    return;
  }
  try {
    await user.findByIdAndUpdate(
      tokenFind._id,
      { $set: { is_verify: true } },
      { new: true }
    );
  } catch (err) {
    res.status(500).json({ msg: err });
    return;
  }
  res.status(200).json({ msg: "success!" });
};

exports.login = async (req, res) => {
  if (
    typeof req.body.email === "undefined" ||
    typeof req.body.password == "undefined"
  ) {
    res.status(402).json({ msg: "Invalid data" });
    return;
  }
  let { email, password } = req.body;
  let userFind = null;
  try {
    userFind = await user.findOne({ email: email });
  } catch (err) {
    res.json({ msg: err });
    return;
  }
  if (userFind == null) {
    res.status(422).json({ msg: "Invalid data" });
    return;
  }

  if (!userFind.is_verify) {
    res.status(401).json({ msg: "no_registration_confirmation" });
    return;
  }

  if (!bcrypt.compareSync(password, userFind.password)) {
    res.status(422).json({ msg: "Invalid data" });
    return;
  }
  let token = jwt.sign(
    { email: email, iat: Math.floor(Date.now() / 1000) - 60 * 30 },
    "shhhhh"
  );
  res.status(200).json({
    msg: "success",
    token: token,
    user: {
      email: userFind.email,
      firstName: userFind.firstName,
      lastName: userFind.lastName,
      address: userFind.address,
      phone_number: userFind.phone_number,
      id: userFind._id,
    },
  });
};

exports.requestForgotPassword = async (req, res) => {
  if (typeof req.params.email === "undefined") {
    res.json({ msg: "Invalid data" });
    return;
  }
  let email = req.params.email;
  let userFind = null;
  try {
    userFind = await user.findOne({ email: email });
  } catch (err) {
    res.json({ msg: err });
    return;
  }
  if (userFind == null) {
    res.status(422).json({ msg: "Invalid data" });
  }
  if (!userFind.is_verify) {
    res.status(401).json({ msg: "no_registration_confirmation" });
    return;
  }
  let token = otp.generateOTP();
  let sendEmail = await nodemailer.sendEmailForgotPassword(email, token);
  if (!sendEmail) {
      res.status(500).json({ msg: "Send email fail" });
      return;
    }
  userFind.token = token;
  try {
    await userFind.save();
  } catch (err) {
    res.status(500).json({ msg: err });
    return;
  }
  res.status(201).json({ msg: "success", email: email });
};

exports.verifyForgotPassword = async (req, res) => {
  if (
    typeof req.body.email === "undefined" ||
    typeof req.body.otp === "undefined"
  ) {
    res.status(402).json({ msg: "Invalid data" });
    return;
  }

  let { email, otp } = req.body;
  let userFind = null;
  try {
    userFind = await user.findOne({ email: email });
  } catch (err) {
    res.json({ msg: err });
    return;
  }
  if (userFind == null) {
    res.status(422).json({ msg: "Invalid data" });
    return;
  }
  if (userFind.token != otp) {
    res.status(422).json({ msg: "OTP fail" });
    return;
  }
  res.status(200).json({ msg: "success", otp: otp });
};

exports.forgotPassword = async (req, res) => {
  if (
    typeof req.body.email === "undefined" ||
    typeof req.body.otp === "undefined" ||
    typeof req.body.newPassword === "undefined"
  ) {
    res.status(402).json({ msg: "Invalid data" });
    return;
  }
  let { email, otp, newPassword } = req.body;
  let userFind = null;
  try {
    userFind = await user.findOne({ email: email });
  } catch (err) {
    res.json({ msg: err });
    return;
  }
  if (userFind == null) {
    res.status(422).json({ msg: "Invalid data" });
    return;
  }
  if (userFind.token != otp) {
    res.status(422).json({ msg: "OTP fail" });
    return;
  }

  userFind.password = bcrypt.hashSync(newPassword, 10);
  try {
    await userFind.save();
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: err });
    return;
  }
  res.status(201).json({ msg: "success" });
};

exports.updateInfor = async (req, res) => {
  if (
    typeof req.body.firstName === "undefined" ||
    typeof req.body.lastName === "undefined" ||
    typeof req.body.address === "undefined" ||
    typeof req.body.phone_number === "undefined" ||
    typeof req.body.email === "undefined"
  ) {
    res.status(422).json({ msg: "Invalid data" });
    return;
  }
  let { email, firstName, lastName, address, phone_number } = req.body;
  let userFind;
  try {
    userFind = await user.findOne({ email: email });
  } catch (err) {
    res.status(500).json({ msg: err });
    return;
  }
  if (userFind === null) {
    res.status(422).json({ msg: "not found" });
    return;
  }
  userFind.firstName = firstName;
  userFind.lastName = lastName;
  userFind.address = address;
  userFind.phone_number = phone_number;
  try {
    await userFind.save();
  } catch (err) {
    res.status(500).json({ msg: err });
    return;
  }
  let token = jwt.sign({ email: email }, "shhhhh");
  res.status(200).json({
    msg: "success",
    token: token,
    user: {
      email: userFind.email,
      firstName: userFind.firstName,
      lastName: userFind.lastName,
      address: userFind.address,
      phone_number: userFind.phone_number,
      id: userFind._id,
    },
  });
};

exports.updatePassword = async (req, res) => {
  if (
    typeof req.body.oldpassword === "undefined" ||
    typeof req.body.newpassword === "undefined" ||
    typeof req.body.email === "undefined"
  ) {
    res.status(422).json({ msg: "Invalid data" });
    return;
  }
  let { email, oldpassword, newpassword } = req.body;
  let userFind = null;
  try {
    userFind = await user.findOne({ email: email });
  } catch (err) {
    res.json({ msg: err });
    return;
  }
  if (userFind == null) {
    res.status(422).json({ msg: "Invalid data" });
    return;
  }
  if (!bcrypt.compareSync(oldpassword, userFind.password)) {
    res.status(422).json({ msg: "Invalid data" });
    return;
  }
  userFind.password = bcrypt.hashSync(newpassword, 10);
  try {
    await userFind.save();
  } catch (err) {
    res.status(500).json({ msg: err });
    return;
  }
  res.status(200).json({ msg: "success" });
};
