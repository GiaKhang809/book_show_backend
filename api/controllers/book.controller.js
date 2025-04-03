'use strict'
const mongoose = require("mongoose");
const book = require('../models/book.model');
const publisherController = require('../controllers/publisher.controller');
const authorController = require('../controllers/author.controller');
const categoryController = require('../controllers/category.controller');

exports.getTotalPage = (req, res) => {
    book.find({}, (err, docs) => {
        if (err) {
            console.log(err);
            res.status(500).json({ msg: err });
            return;
        }
        res.status(200).json({ data: parseInt((docs.length - 1) / 9) + 1 })
    })
}

exports.getAllBook = async (req, res) => {
    try {
        console.log(req.body); // Kiểm tra đầu vào thực tế
      if ((typeof req.body.page === 'undefined')) {
        return res.status(422).json({ msg: 'Invalid data' });
      }
      const { page, range, searchtext, sorttype, sortorder } = req.body;
  
      // Handle Khoang gia (Price Range)
      let objRange = range || null;
  
      // Handle Search Text
      const searchText = searchtext || "";
  
      const searchPublisher = await publisherController.getIDBySearchText(searchText);
      const searchAuthor = await authorController.getIDBySearchText(searchText);
      const searchCategory = await categoryController.getIDBySearchText(searchText);

      // Handle Sort Type and Order
      let sortType = sorttype || "release_date";
      let sortOrder = sortorder || "-1";
      
      const validSortTypes = ["price", "release_date", "view_counts", "sales"];
      const validSortOrders = ["1", "-1"];
  
      if (!validSortTypes.includes(sortType) || !validSortOrders.includes(sortOrder)) {
        return res.status(422).json({ msg: 'Invalid sort type or order' });
      }
  
      // Calculate pagination
      const bookCount = await book.count({
        $or: [
          { name: new RegExp(searchText, "i") },
          { id_nsx: { $in: searchPublisher } },
          { id_author: { $in: searchAuthor } },
          { id_category: { $in: searchCategory } }
        ],
        ...(objRange && { price: { $gte: objRange.low, $lte: objRange.high } })
      });
  
      const totalPage = Math.ceil(bookCount / 9);
      
      if (page < 1 || page > totalPage) {
        return res.status(200).json({ data: [], msg: 'Invalid page', totalPage });
      }
  
      const sortQuery = { [sortType]: sortOrder };
  
      const books = await book
        .find({
          $or: [
            { name: new RegExp(searchText, "i") },
            { id_nsx: { $in: searchPublisher } },
            { id_author: { $in: searchAuthor } },
            { id_category: { $in: searchCategory } }
          ],
          ...(objRange && { price: { $gte: objRange.low, $lte: objRange.high } })
        })
        .skip(9 * (page - 1))
        .limit(9)
        .sort(sortQuery);
  
      res.status(200).json({ data: books, totalPage });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  };
  
  exports.getBookByPublisher = async (req, res) => {
    try {
      const { id, page, range, searchtext, sorttype, sortorder } = req.body;
      if (typeof page === 'undefined' || typeof id === 'undefined') {
        return res.status(422).json({ msg: 'Invalid data' });
      }
  
      // Handle Khoang gia (Price Range)
      let objRange = range || null;
  
      // Handle Search Text
      const searchText = searchtext || "";
  
      // Handle Sort Type and Order
      let sortType = sorttype || "release_date";
      let sortOrder = sortorder || "-1";
      
      const validSortTypes = ["price", "release_date", "view_counts", "sales"];
      const validSortOrders = ["1", "-1"];
  
      if (!validSortTypes.includes(sortType) || !validSortOrders.includes(sortOrder)) {
        return res.status(422).json({ msg: 'Invalid sort type or order' });
      }
  
      // Calculate pagination
      const bookCount = await book.count({
        name: new RegExp(searchText, "i"),
        id_nsx: id,
        ...(objRange && { price: { $gte: objRange.low, $lte: objRange.high } })
      });
  
      const totalPage = Math.ceil(bookCount / 9);
  
      if (page < 1 || page > totalPage) {
        return res.status(200).json({ data: [], msg: 'Invalid page', totalPage });
      }
  
      const sortQuery = { [sortType]: sortOrder };
  
      // Fetch the books with pagination and sorting
      const books = await book
        .find({
          name: new RegExp(searchText, "i"),
          id_nsx: id,
          ...(objRange && { price: { $gte: objRange.low, $lte: objRange.high } })
        })
        .skip(9 * (page - 1))
        .limit(9)
        .sort(sortQuery);
  
      res.status(200).json({ data: books, totalPage });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  };
  

exports.getBookByCategory = async (req, res) => {
    if (typeof req.body.id === 'undefined'
        || typeof req.body.page === 'undefined'
    ) {
        res.status(422).json({ msg: 'Invalid data' });
        return;
    }
    let { id, page } = req.body;
    //Khoang gia
    let range = null;
    let objRange = null;
    console.log(req.body.range)
    if (typeof req.body.range !== 'undefined') {
        range = req.body.range;
        objRange = range;
    }
    //Kiem tra text
    let searchText = "";
    if (typeof req.body.searchtext !== 'undefined') {
        searchText = req.body.searchtext;
    }
    //Sap xep
    let sortType = "release_date";
    let sortOrder = "-1";
    if (typeof req.body.sorttype !== 'undefined') {
        sortType = req.body.sorttype;
    }
    if (typeof req.body.sortorder !== 'undefined') {
        sortOrder = req.body.sortorder;
    }
    if ((sortType !== "price")
        && (sortType !== "release_date")
        && (sortType !== "view_counts")
        && (sortType !== "sales")) {
        res.status(422).json({ msg: 'Invalid sort type' });
        return;
    }
    if ((sortOrder !== "1")
        && (sortOrder !== "-1")) {
        res.status(422).json({ msg: 'Invalid sort order' });
        return;
    }
    //Tinh tong so trang
    let bookCount, bookFind;
    try {
        if (range === null) {
            bookFind = await book.find({ id_category: id, name: new RegExp(searchText, "i") });
        } else {
            bookFind = await book.find({ id_category: id, name: new RegExp(searchText, "i"), price: { $gte: objRange.low, $lte: objRange.high } });
        }
    }
    catch (err) {
        res.status(500).json({ msg: err });
        return;
    }
    bookCount = bookFind.length;
    let totalPage = parseInt(((bookCount - 1) / 9) + 1);
    if (parseInt(page) < 1 || parseInt(page) > totalPage) {
        res.status(200).json({ data: [], msg: 'Invalid page', totalPage: totalPage });
        return;
    }
    //De sort
    let sortQuery = {}
    sortQuery[sortType] = sortOrder;
    //Lay du lieu
    if (range === null) {
        book.find({ id_category: id, name: new RegExp(searchText, "i") })
            .limit(9)
            .skip(9 * (page - 1))
            .sort(sortQuery)
            .exec((err, docs) => {
                if (err) {
                    console.log(err);
                    res.status(500).json({ msg: err });
                    return;
                }
                res.status(200).json({ data: docs, totalPage: totalPage });
            })
    } else {
        book.find({ id_category: id, name: new RegExp(searchText, "i"), price: { $gte: objRange.low, $lte: objRange.high } })
            .limit(9)
            .skip(9 * (page - 1))
            .sort(sortQuery)
            .exec((err, docs) => {
                if (err) {
                    console.log(err);
                    res.status(500).json({ msg: err });
                    return;
                }
                res.status(200).json({ data: docs, totalPage: totalPage });
            })
    }
}

exports.getBookByAuthor = async (req, res) => {
    if (typeof req.body.id === 'undefined'
        || typeof req.body.page === 'undefined'
    ) {
        res.status(422).json({ msg: 'Invalid data' });
        return;
    }
    let { id, page } = req.body;
    //Khoang gia
    let range = null;
    let objRange = null;
    if (typeof req.body.range !== 'undefined') {
        range = req.body.range;
        objRange = range;
    }
    //Kiem tra text
    let searchText = "";
    if (typeof req.body.searchtext !== 'undefined') {
        searchText = req.body.searchtext;
    }
    //Sap xep
    let sortType = "release_date";
    let sortOrder = "-1";
    if (typeof req.body.sorttype !== 'undefined') {
        sortType = req.body.sorttype;
    }
    if (typeof req.body.sortorder !== 'undefined') {
        sortOrder = req.body.sortorder;
    }
    if ((sortType !== "price")
        && (sortType !== "release_date")
        && (sortType !== "view_counts")
        && (sortType !== "sales")) {
        res.status(422).json({ msg: 'Invalid sort type' });
        return;
    }
    if ((sortOrder !== "1")
        && (sortOrder !== "-1")) {
        res.status(422).json({ msg: 'Invalid sort order' });
        return;
    }
    //De sort
    let sortQuery = {}
    sortQuery[sortType] = sortOrder;
    //Tinh tong so trang
    let bookCount, bookFind;
    try {
        if (range === null) {
            bookFind = await book.find({ id_author: id, name: new RegExp(searchText, "i") });
        } else {
            bookFind = await book.find({ id_author: id, name: new RegExp(searchText, "i"), price: { $gte: objRange.low, $lte: objRange.high } });
        }
    }
    catch (err) {
        res.status(500).json({ msg: err });
        return;
    }
    bookCount = bookFind.length;
    let totalPage = parseInt(((bookCount - 1) / 9) + 1);
    if (parseInt(page) < 1 || parseInt(page) > totalPage) {
        res.status(200).json({ data: [], msg: 'Invalid page', totalPage: totalPage });
        return;
    }
    //Lay du lieu
    if (typeof req.body.range === 'undefined') {
        book.find({ id_author: id, name: new RegExp(searchText, "i") })
            .limit(9)
            .skip(9 * (page - 1))
            .sort(sortQuery)
            .exec((err, docs) => {
                if (err) {
                    console.log(err);
                    res.status(500).json({ msg: err });
                    return;
                }
                res.status(200).json({ data: docs, totalPage: totalPage });
            })
    } else {
        book.find({ id_author: id, name: new RegExp(searchText, "i"), price: { $gte: objRange.low, $lte: objRange.high } })
            .limit(9)
            .skip(9 * (page - 1))
            .sort(sortQuery)
            .exec((err, docs) => {
                if (err) {
                    console.log(err);
                    res.status(500).json({ msg: err });
                    return;
                }
                res.status(200).json({ data: docs, totalPage: totalPage });
            });
    }
}

exports.getBookByID = async (req, res) => {
    if (req.params.id === 'undefined') {
        res.status(422).json({ msg: 'Invalid data' });
        return;
    }
    let result
    try {
        result = await book.findById(req.params.id);
    }
    catch (err) {
        console.log(err)
        res.status(500).json({ msg: err })
        return;
    }

    if (result === null) {
        res.status(404).json({ msg: "not found" })
        return;
    }
    result.view_counts = result.view_counts + 1;
    result.save((err, docs) => {
        if (err) {
            console.log(err);
        }
    });
    res.status(200).json({ data: result })
}

exports.getRelatedBook = async (req, res) => {
    if (typeof req.params.bookId === 'undefined') {
        res.status(422).json({ msg: 'Invalid data' });
        return;
    }
    let { bookId } = req.params;
    let bookObj = null;
    try {
        bookObj = await book.findById(bookId);
    }
    catch (err) {
        console.log(err)
        res.status(500).json({ msg: err })
        return;
    }
    if (bookObj === null) {
        res.status(200).json({ data: [], msg: 'Invalid bookId' });
        return;
    }
    book
        .find({ $or: [{ $and: [{ id_category: bookObj.id_category }, { _id: { $nin: [bookId] } }] }, { $and: [{ id_author: bookObj.id_author }, { _id: { $nin: [bookId] } }] }] })
        .limit(5)
        .sort({ release_date: -1 })
        .exec((err, docs) => {
            if (err) {
                console.log(err);
                res.status(500).json({ msg: err });
                return;
            }
            res.status(200).json({ data: docs });
        });
}