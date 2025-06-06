'use strict'
const bill_controller = require('../controllers/bill.controller');
module.exports = (app) => {
    app.route('/bill/add')
        .post(bill_controller.addBill);
        //pass run
    app.route('/bill/verify/:token')
        .get(bill_controller.verifyPayment);
        //pass run
    app.route('/bill/:id_user')
        .get(bill_controller.getBillByIDUser);
        //pass run
    app.delete('/bill/delete/:id', bill_controller.deleteBill);
        //pass run 
    app.route('/bill/top/')
        .post(bill_controller.statisticalTop10);
    app.route('/bill/statistical/revenue/day')
        .post(bill_controller.statisticaRevenueDay);
    app.route('/bill/statistical/revenue/month')
        .post(bill_controller.statisticaRevenueMonth);
    app.route('/bill/statistical/revenue/year')
        .post(bill_controller.statisticaRevenueYear);
    app.route('/bill/statistical/revenue/quauter')
        .post(bill_controller.statisticaRevenueQuauter);
    //pass run
    app.route('/bill/status/99')
        .get(bill_controller.getBillNoVerify);
    //pass run
    app.route('/bill/status/1')
        .get(bill_controller.getBillVerify);
    //pass run
    app.route('/bill/status/0')
        .get(bill_controller.getProcessing);
        
    app.route('/bill/updateissend')
        .post(bill_controller.updateIssend);
}