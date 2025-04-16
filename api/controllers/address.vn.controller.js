'use strict'
const address = require('../models/address.vn.model');
exports.getAllCity = async (req, res) => {
    try{
        const docs = await address.find({});
        if (docs.length === 0) {
            return res.status(404).json({ msg: "Không có dữ liệu thành phố nào." });
        }
        const data = docs.map(doc => ({
            name: doc.city,
            code: doc.code,
        }));
        return res.status(200).json({data})
    }catch (err){
        console.error("Error getting cities:", err);
        return res.status(500).json({ msg: "Server error", error: err.message });
    }
};
exports.getAllDistrict = async (req, res) => {
    try{
        const docs = await address.findOne({code: req.params.code})
        if(!docs){
            return res.status(404).json({ msg: 'Không có thành phố với mã code này.' });
        }
        const data = docs.district.map(d => ({ 
            name: d.name, 
            code: d.code 
        }));
         return res.status(200).json({ data });
    } catch (err) {
        return res.status(500).json({ msg: err.message });
    }
};
exports.getAllWard = async (req, res) => {
    try{
        const docs = await address.findOne({code: req.body.codecity});
        if(!docs){
            return res.status(404).json({msg: 'Không có thành phố'});
        }
        const district = docs.district.find(d => d.code === req.body.codedistrict);
            if(!district) {
                return res.status(404).json({msg: 'Quận/Huyện không tồn tại' });
            }
            res.status(200).json({ data: district.ward });
    }catch(err){
        console.error("Error:", err);
        return res.status(500).json({msg: err.message});
    }
}
