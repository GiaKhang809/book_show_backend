'use strict';
const publisher = require('../models/publisher.model');

// Lấy tất cả các publisher
exports.getPublisher = async (req, res) => {
    try {
        const docs = await publisher.find({}); // Không sử dụng callback
        res.status(200).json({ data: docs });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: err.message || 'Internal Server Error' });
    }
};

// Lấy tất cả các publisher với phân trang
exports.getAll = async (req, res) => {
    const { page } = req.params;

    if (!page) {
        return res.status(402).json({ msg: 'Data invalid' });
    }

    try {
        const count = await publisher.countDocuments(); // Đếm tổng số publisher
        const totalPage = Math.ceil(count / 9);

        if (parseInt(page) < 1 || parseInt(page) > totalPage) {
            return res.status(200).json({ data: [], msg: 'Invalid page', totalPage });
        }

        const docs = await publisher.find({})  // Lấy publisher theo trang
            .skip(9 * (parseInt(page) - 1))
            .limit(9);

        res.status(200).json({ data: docs, totalPage });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: err.message || 'Internal Server Error' });
    }
};

// Lấy tên publisher theo ID
exports.getNameByID = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(422).json({ msg: 'Invalid data' });
    }

    try {
        const result = await publisher.findById(id); // Tìm publisher theo ID
        if (!result) {
            return res.status(404).json({ msg: 'Not found' });
        }

        res.status(200).json({ name: result.name });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: err.message || 'Internal Server Error' });
    }
};

// Lấy danh sách ID của các publisher theo tên
exports.getIDBySearchText = async (searchText) => {
    try {
        const arr = await publisher.find(
            { name: new RegExp(searchText, 'i') }, // Tìm theo tên publisher
            { name: 0 }
        );
        return arr.map(i => i.id);
    } catch (err) {
        console.error(err);
        return [];
    }
};