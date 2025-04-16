"use strict";
require('dotenv').config();
const cloudinary = require('cloudinary').v2;
var uploads = {};
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
console.log(" Cloudinary configured successfully!");

const book = require("../models/book.model");
const user = require("../models/user.model");
const category = require("../models/category.model");
const author = require("../models/author.model");
const publisher = require("../models/publisher.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const uploadImg = async (path) => {
  try {
    const res = await cloudinary.uploader.upload(path);
    return res.secure_url;
  } catch (err) {
    console.error(" Upload failed:", err);
    return false;
  }
};
exports.addBook = async (req, res) => {
  const { id_category, name, price, release_date, describe, id_nsx, id_author } = req.body;

  // Kiểm tra các trường dữ liệu và file
  if (!req.file || !id_category || !name || !price || !release_date || !describe || !id_nsx || !id_author) {
    return res.status(422).json({ msg: "Invalid data" });
  }

  try {
    // Upload ảnh và lưu thông tin sách vào DB
    const urlImg = await uploadImg(req.file.path);
    if (!urlImg) {
      return res.status(500).json({ msg: "Server error during image upload" });
    }

    const newBook = new book({
      id_category, name, price, release_date, img: urlImg, describe, id_nsx, id_author
    });

    await newBook.save(); // Lưu sách vào DB

    // Xóa ảnh tạm sau khi lưu thành công
    fs.unlink(req.file.path, (err) => {
      if (err) console.error("Error removing temporary file:", err);
    });

    res.status(201).json({ msg: "Success" });

  } catch (err) {
    console.error("Error in addBook:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.updateBook = async (req, res) => {
  const { name, id, id_category, price, release_date, describe, category } = req.body;

  // Kiểm tra các trường cần thiết
  if (!id || !name || !id_category || !price || !release_date || !describe) {
    return res.status(422).json({ msg: "Invalid data" });
  }

  try {
    // Tìm sách theo id
    const bookFind = await book.findById(id);
    if (!bookFind) {
      return res.status(404).json({ msg: "Not found" });
    }

    // Xử lý ảnh nếu có
    let urlImg = bookFind.img; // Giữ nguyên ảnh hiện tại nếu không có ảnh mới
    if (req.file) {
      urlImg = await uploadImg(req.file.path);
      if (!urlImg) {
        return res.status(500).json({ msg: "Server error during image upload" });
      }
    }

    // Cập nhật thông tin sách
    bookFind.id_category = id_category;
    bookFind.name = name;
    bookFind.price = parseFloat(price);
    bookFind.release_date = release_date;
    bookFind.describe = describe;
    bookFind.category = category;
    bookFind.img = urlImg;

    // Lưu sách đã cập nhật
    const updatedBook = await bookFind.save();
    res.status(200).json({ msg: "Success", data: updatedBook });

  } catch (err) {
    console.error(" Error in updateBook:", err);
    res.status(500).json({ msg: "Failed to update the book", error: err.message });
  }
};


exports.deletebook = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(422).json({ msg: "Invalid data" });

    const bookFind = await book.findById(id);
    if (!bookFind) return res.status(404).json({ msg: "Book not found" });

    await bookFind.deleteOne();
    res.status(200).json({ msg: "Deleted successfully" });
  } catch (err) {
    console.error("Delete Book Error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.updateUser = async (req, res) => {
  const { email, firstName, lastName, address, phone_number, is_admin } = req.body;

  // Kiểm tra các trường cần thiết
  if (!email || !firstName || !lastName || !address || !phone_number || is_admin === undefined) {
    return res.status(422).json({ msg: "Invalid data" });
  }

  try {
    // Tìm người dùng theo email
    let userFind = await user.findOne({ email: email });
    if (!userFind) {
      return res.status(422).json({ msg: "User not found" });
    }

    // Cập nhật thông tin người dùng
    userFind.firstName = firstName;
    userFind.lastName = lastName;
    userFind.address = address;
    userFind.phone_number = phone_number;
    userFind.is_admin = is_admin;

    // Lưu thông tin đã cập nhật
    await userFind.save();

    // Trả về thông tin người dùng đã cập nhật
    res.status(200).json({
      msg: "Success",
      user: {
        email: userFind.email,
        firstName: userFind.firstName,
        lastName: userFind.lastName,
        address: userFind.address,
        phone_number: userFind.phone_number,
        is_admin: userFind.is_admin,
      },
    });

  } catch (err) {
    console.error(" Error in updateUser:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.addPublisher = async (req, res) => {
  const { name } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (!name) {
    return res.status(422).json({ msg: "Invalid data" });
  }

  try {
    // Kiểm tra xem nhà xuất bản đã tồn tại chưa
    const publisherFind = await publisher.findOne({ name: name });
    if (publisherFind) {
      return res.status(409).json({ msg: "Publisher already exists" });
    }

    // Tạo nhà xuất bản mới
    const newPublisher = new publisher({ name });
    await newPublisher.save();

    res.status(201).json({ msg: "Success" });

  } catch (err) {
    console.error(" Error in addPublisher:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.updatePublisher = async (req, res) => {
  const { id, name } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (!id || !name) {
    return res.status(422).json({ msg: "Invalid data" });
  }

  try {
    // Tìm nhà xuất bản theo id
    const publisherFind = await publisher.findById(id);
    if (!publisherFind) {
      return res.status(404).json({ msg: "Publisher not found" });
    }

    // Cập nhật tên nhà xuất bản
    publisherFind.name = name;

    // Lưu nhà xuất bản đã cập nhật
    await publisherFind.save();

    res.status(200).json({ msg: "Success", publisher: { name } });

  } catch (err) {
    console.error("Error in updatePublisher:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};


exports.deleteUser = async (req, res) => {
  const { email } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (!email) {
    return res.status(422).json({ msg: "Invalid data" });
  }

  try {
    // Tìm người dùng theo email
    const userFind = await user.findOne({ email });
    if (!userFind) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Xóa người dùng
    await userFind.deleteOne();  // hoặc userFind.remove()

    res.status(200).json({ msg: "Success" });

  } catch (err) {
    console.error("Error in deleteUser:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};


exports.addCategory = async (req, res) => {
  const { name } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (!name) {
    return res.status(422).json({ msg: "Invalid data" });
  }

  try {
    // Kiểm tra xem thể loại đã tồn tại chưa
    const categoryFind = await category.findOne({ name });
    if (categoryFind) {
      return res.status(409).json({ msg: "Category already exists" });
    }

    // Tạo thể loại mới
    const newCategory = new category({ name });
    await newCategory.save();

    res.status(201).json({ msg: "Success" });

  } catch (err) {
    console.error(" Error in addCategory:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};


exports.updateCategory = async (req, res) => {
  const { id, name } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (!id || !name) {
    return res.status(422).json({ msg: "Invalid data" });
  }

  try {
    // Tìm thể loại theo ID
    const categoryFind = await category.findById(id);
    if (!categoryFind) {
      return res.status(404).json({ msg: "Category not found" });
    }

    // Cập nhật tên thể loại
    categoryFind.name = name;
    
    // Lưu thể loại đã cập nhật
    await categoryFind.save();

    res.status(200).json({ msg: "Success", category: { name } });

  } catch (err) {
    console.error("Error in updateCategory:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};


exports.addAuthor = async (req, res) => {
  const { name } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (!name) {
    return res.status(422).json({ msg: "Invalid data" });
  }

  try {
    // Kiểm tra xem tác giả đã tồn tại chưa
    const authorFind = await author.findOne({ name });
    if (authorFind) {
      return res.status(409).json({ msg: "Author already exists" });
    }

    // Tạo tác giả mới
    const newAuthor = new author({ name });
    await newAuthor.save();

    res.status(201).json({ msg: "Success" });

  } catch (err) {
    console.error(" Error in addAuthor:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};


exports.updateAuthor = async (req, res) => {
  const { id, name } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (!id || !name) {
    return res.status(422).json({ msg: "Invalid data" });
  }

  try {
    // Tìm tác giả theo ID
    const authorFind = await author.findById(id);
    if (!authorFind) {
      return res.status(404).json({ msg: "Author not found" });
    }

    // Cập nhật tên tác giả
    authorFind.name = name;
    
    // Lưu tác giả đã cập nhật
    const updatedAuthor = await authorFind.save();

    res.status(200).json({ msg: "Success", author: updatedAuthor });

  } catch (err) {
    console.error(" Error in updateAuthor:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.addUser = async (req, res) => {
  const { email, password, firstName, lastName, address, phone_number, is_admin } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (!email || !password || !firstName || !lastName || !address || !phone_number || typeof is_admin === "undefined") {
    return res.status(422).json({ msg: "Invalid data" });
  }

  try {
    // Kiểm tra xem email đã tồn tại chưa
    const userFind = await user.findOne({ email });
    if (userFind) {
      return res.status(409).json({ msg: "Email already exists" });
    }

    // Mã hóa mật khẩu
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Tạo người dùng mới
    const newUser = new user({
      email,
      firstName,
      lastName,
      password: hashedPassword,
      address,
      phone_number,
      is_verify: true,
      is_admin,
    });

    // Lưu người dùng mới
    await newUser.save();
 //  Gửi webhook đến n8n
  await fetch('https://n8n.mitelai.com/webhook-test/10f0e712-80fb-4dc6-9bc0-2dc63fae1a0d', {
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
      is_admin,
      //token,
      createdAt: new Date().toISOString()
    }
  })
  }).catch(err => {
    console.error('Webhook fetch error:', err);
  });
    return res.status(201).json({ msg: "Success" });

  } catch (err) {
    console.error(" Error in addUser:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.getAllUser = async (req, res) => {
  const { page } = req.params;

  // Kiểm tra nếu page không có
  if (!page) {
    return res.status(422).json({ msg: "Data invalid" });
  }

  try {
    // Đếm số lượng người dùng
    const count = await user.countDocuments({});
    const totalPage = Math.ceil(count / 9); // Tính tổng số trang

    // Kiểm tra xem page có hợp lệ không
    if (parseInt(page) < 1 || parseInt(page) > totalPage) {
      return res.status(400).json({ data: [], msg: "Invalid page", totalPage });
    }

    // Lấy dữ liệu người dùng theo trang
    const users = await user
      .find({})
      .skip(9 * (parseInt(page) - 1))
      .limit(9);

    // Trả về kết quả
    res.status(200).json({ data: users, totalPage });
    
  } catch (err) {
    console.error("Error in getAllUser:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(402).json({ msg: "Invalid data" });
    }

    const userFind = await user.findOne({ email, is_admin: true });

    if (!userFind) {
      return res.status(422).json({ msg: "Invalid data" });
    }

    if (!userFind.is_verify) {
      return res.status(401).json({ msg: "no_registration_confirmation" });
    }

    const isPasswordValid = bcrypt.compareSync(password, userFind.password);
    if (!isPasswordValid) {
      return res.status(422).json({ msg: "Invalid data" });
    }

    const token = jwt.sign(
      { email: userFind.email, iat: Math.floor(Date.now() / 1000) - 60 * 30 },
      process.env.JWT_SECRET || "shhhhh"
    );

    res.status(200).json({
      msg: "success",
      token,
      user: {
        email: userFind.email,
        firstName: userFind.firstName,
        lastName: userFind.lastName,
        address: userFind.address,
        phone_number: userFind.phone_number,
        id: userFind._id,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ msg: err.message });
  }
};
