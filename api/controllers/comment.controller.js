"use strict";
const _comment = require("../models/comment.model");
const book = require("../models/book.model");

exports.mycomment = async (req, res) => {
  if (
    typeof req.body.id_user === "undefined" ||
    typeof req.body.id_book === "undefined" ||
    typeof req.body.name === "undefined" ||
    typeof req.body.comment === "undefined"
  ) {
    res.status(422).json({ msg: "Invalid data" });
    return;
  }

  let { id_user, id_book, name, comment } = req.body;
  let bookFind;
  try {
    bookFind = await book.findById(id_book);
  } catch (err) {
    res.status(422).json({ msg: " ID book Invalid data" });
    return;
  }
  const new_comment = _comment({
    id_user: id_user,
    id_book: id_book,
    name: name,
    comment: comment
  });
  try {
    new_comment.save();
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: err });
    return;
  }
  res.status(201).json({ msg: "success" });
  return;
};

exports.getCommentByIDBook = async (req, res) => {
  try {
    const { id_book, page } = req.body;

    if (typeof id_book === "undefined" || typeof page === "undefined") {
      return res.status(422).json({ msg: "Invalid data" });
    }

    const count = await _comment.countDocuments({ id_book });
    const totalPage = Math.max(1, Math.ceil(count / 9));

    if (parseInt(page) < 1 || parseInt(page) > totalPage) {
      return res.status(200).json({ data: [], msg: "Invalid page", totalPage });
    }

    const comments = await _comment
      .find({ id_book })
      .skip(9 * (parseInt(page) - 1))
      .limit(9)
      .sort({ date: 1 })
      .exec();

    return res.status(200).json({ data: comments, totalPage });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error" });
  }
};
