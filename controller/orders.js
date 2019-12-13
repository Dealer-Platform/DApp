const config = require('../config.json');
const nav = require('./parent');
const jsdom = require("jsdom");
const jquery = require("jquery");
//const db = require('../logic/mongodb');
const db = require('../logic/ipfs');
const chainwrite = require('../logic/chainwrite');

const chainread = require('../logic/chainread');
const site = "orders";

module.exports = {

    handleRequest(req, res) {
    },


//get order page and its buttons
    loadPage(res, err, done) {
        let orders = nav.load(site);
        let order_items = chainread.orders();
        order_items.then(function (result) {

            let debug = "";

            let table_myOrders = '<table class="table align-items-center table-flush">';
            table_myOrders += '<tr><th>#</th><th>Item</th><th>Orderdate</th><th>Seller</th><th>Download</th></tr>'
            for (let i = 0; i < result.rows.length; i++) {
                let row = result.rows[i];

                if (row.buyer != config.user)
                    continue;


                table_myOrders += '<tr>';
                //key
                table_myOrders += '<td>' + row.key + '</td>';
                //itemkey
                table_myOrders += '<td>' + row.itemKey + '</td>';
                //buyer
                table_myOrders += '<td>' + row.seller + '</td>';

                table_myOrders += '<td>' + row.timestamp + '</td>';

                //ACTION BUTTON
                // if (row.finished == 0) {
                //     table_myOrders += '<td><div class="label-ok text-orange"><i class="ni ni-2x ni-watch-time"></i></i></div></td>';
                // } else {
                //     table_myOrders += '<td><div class="label-ok text-green"><i class="ni ni-2x ni-check-bold"></i></i></div></td>';
                // }

                table_myOrders += '<td><a href="/download?user=' + row.seller + '&key=' + row.itemKey + '" class="btn btn-sm btn-primary">Download</a></td>';
                table_myOrders += '</tr>';
            }
            table_myOrders += '</table>';

            //place tables
            let orders_dom = new jsdom.JSDOM(orders);
            let $ = jquery(orders_dom.window);
            // $('p.allOrders').html(debug);
            $('.table-responsive').html(table_myOrders);
            $(".debug").html(debug);
            orders = orders_dom.serialize();

            nav.deliver(res, orders, err, done);
        }, function (err) {
            console.log(err);
        });
    }
};