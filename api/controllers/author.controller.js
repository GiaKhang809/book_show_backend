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
    if (req.params.id === 'undefined') {
        return res.status(422).json({ msg: 'Invalid data' });
    }

    let result;
    try {
        result = await author.findById(req.params.id);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: err.message });
    }

    if (result === null) {
        return res.status(404).json({ msg: "Not found" });
    }

    res.status(200).json({ name: result.name });
}

exports.getAuthor = async (req, res) => {
    try {
        const docs = await author.find({});
        res.status(200).json({ data: docs });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: err.message });
    }
}
