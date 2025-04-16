'use strict'
const address_vn_controller = require('../controllers/address.vn.controller');
module.exports = (app) => {
    // pass run
    app.route('/address/city/all')
        .get(address_vn_controller.getAllCity);
    // pass run
    app.route('/address/city/district/:code')
        .get(address_vn_controller.getAllDistrict);
    // pass run
    app.route('/address/city/district/ward')
        .post(address_vn_controller.getAllWard);
//         {
//             "codecity": "79",  
//             "codedistrict": "01"
//           }
}