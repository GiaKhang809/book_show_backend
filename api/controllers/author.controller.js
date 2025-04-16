'use strict';
const author = require('../models/author.model');

exports.getIDBySearchText = async (searchText) => {
    try {
        const arr = await author.find({ name: new RegExp(searchText, "i") }, { name: 0 });
        return arr.map(i => i.id);
    } catch (err) {
        console.error(err);
        throw new Error('Error retrieving authors');
    }
}

exports.getAll = async (req, res) => {
    if (typeof req.params.page === 'undefined') {
        return res.status(402).json({ msg: 'Data invalid' });
    }

    let count = null;
    try {
        count = await author.countDocuments({});
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: err.message });
    }

    const totalPage = Math.ceil(count / 9);
    const { page } = req.params;

    if (parseInt(page) < 1 || parseInt(page) > totalPage) {
        return res.status(200).json({ data: [], msg: 'Invalid page', totalPage });
    }

    try {
        const docs = await author.find({})
            .skip(9 * (parseInt(page) - 1))
            .limit(9);
        res.status(200).json({ data: docs, totalPage });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: err.message });
    }
}

exports.getNameByID = async (req, res) => {
    const { id } = req.params;
  
    // Kiểm tra xem id có tồn tại trong params hay không
    if (!id) {
      return res.status(422).json({ msg: "Invalid data: ID is required" });
    }
  
    try {
      // Tìm tác giả theo ID
      const authorFound = await author.findById(id);
  
      // Kiểm tra xem có tìm thấy tác giả hay không
      if (!authorFound) {
        return res.status(404).json({ msg: "Author not found" });
      }
  
      // Trả về tên tác giả nếu tìm thấy
      res.status(200).json({ name: authorFound.name });
    } catch (err) {
      console.error("Error in getNameByID:", err);
      res.status(500).json({ msg: "Server error: " + err.message });
    }
  };
  

exports.getAuthor = async (req, res) => {
    try {
        const authors = await author.find({});
        res.status(200).json({ data: authors });
    } catch (err) {
        console.error('Error in getAuthor:', err);
        res.status(500).json({ msg: err.message });
    }
}
