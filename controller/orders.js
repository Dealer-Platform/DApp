const config = require('../config.json');
const nav = require('./parent');
const jsdom = require("jsdom");
const jquery = require("jquery");
const db = require('../logic/ipfs');

const chainread = require('../logic/chainread');
const site = "orders";

module.exports = {

  handleRequest(req, res) {
  },


//get order page and its buttons
  async loadPage(res, err, done) {
    let orders = nav.load(site);
    let order_items = await chainread.orders();
    let items = await chainread.items();
    let users = await chainread.users();

    let table_myOrders = '<table class="table align-items-center table-flush">';
    table_myOrders += '<tr><th>Item</th><th>Reporter</th><th>Name</th><th>Description</th></th><th>Orderdate</th><th>Download</th></tr>';
    for (let i = 0; i < order_items.rows.length; i++) {
      let row = order_items.rows[i];
      if (row.buyer !== config.user)
        continue;

      let item = items.rows.filter(i => i.key === row.itemKey)[0];
      let user = users.rows.filter(i => i.user === row.seller)[0];

      table_myOrders += '<tr>';
      table_myOrders += '<td>' + row.itemKey + '</td>';
      table_myOrders += '<td>' + row.seller + '</td>';
      table_myOrders += '<td>' + item.title + '</td>';
      table_myOrders += '<td>' + item.description + '</td>';
      table_myOrders += '<td>' + row.timestamp + '</td>';

      //ACTION BUTTON
      // if (row.finished == 0) {
      //     table_myOrders += '<td><div class="label-ok text-orange"><i class="ni ni-2x ni-watch-time"></i></i></div></td>';
      // } else {
      //     table_myOrders += '<td><div class="label-ok text-green"><i class="ni ni-2x ni-check-bold"></i></i></div></td>';
      // }

      //check if key available
      try {
        let res = await db.read_key(user, item.hash);
        table_myOrders += '<td><a href="/download?user=' + row.seller + '&hash=' + item.hash + '" class="btn btn-sm btn-primary">Download</a></td>';
      } catch (err) {
        table_myOrders += '<td>No key available</td>'
      }
      table_myOrders += '</tr>';
    }
    table_myOrders += '</table>';

    //place tables
    let orders_dom = new jsdom.JSDOM(orders);
    let $ = jquery(orders_dom.window);
    $('.table-responsive').html(table_myOrders);
    orders = orders_dom.serialize();

    nav.deliver(res, orders, err, done);
  }
};