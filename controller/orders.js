const config = require('../config.json');
const nav = require('./parent');
const jsdom = require("jsdom");
const jquery = require("jquery");
const db = require('../logic/ipfs');

const chainread = require('../logic/chainread');
const chainwrite = require('../logic/chainwrite');
const site = "orders";

module.exports = {

  async handleRequest(req, res) {
    let fnc = req.body.fnc;
    let order = req.body.order;

    console.log(fnc);

    if (fnc === "opendispute")
      await chainwrite.opendispute(order);

    if (fnc === "closedispute")
      await chainwrite.closedispute(order);

    if (fnc === "redeem")
      await chainwrite.redeemorder(order);

    await this.loadPage(res)
  },


//get order page and its buttons
  async loadPage(res, err, done) {
    let orders = nav.load(site);
    let order_items = await chainread.orders();
    let items = await chainread.items();
    let users = await chainread.users();

    let table_myOrders = '<table class="table align-items-center table-flush">';
    table_myOrders += '<tr><th>Item</th><th>Reporter</th><th>Name</th><th>Description</th></th><th>Order Date</th><th>Status</th><th>Actions</th><th>Rate</th></tr>';
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
      table_myOrders += '<td>' + new Date(row.timestamp).toLocaleString() + '</td>';

      //ACTION BUTTON
      // if (row.finished == 0) {
      //     table_myOrders += '<td><div class="label-ok text-orange"><i class="ni ni-2x ni-watch-time"></i></i></div></td>';
      // } else {
      //     table_myOrders += '<td><div class="label-ok text-green"><i class="ni ni-2x ni-check-bold"></i></i></div></td>';
      // }

      if(row.dispute){
        table_myOrders += '<td>Disputed</td><td>';
        table_myOrders += '<a href="/download?user=' + row.seller + '&hash=' + item.hash + '&dispute=' + row.itemKey + '" class="btn btn-sm btn-primary">Download</a></td><td>';
        table_myOrders += '<form id="dispupform" class="inline" action="/orders" method="post"><input name="order" type="hidden" value="' + row.key + '" /><input name="fnc" type="hidden" value="finish" /><span class="fa fa-2x fa-thumbs-up thumbsbutton text-green" onclick="$(\'#dispupform\').submit();"></span></form>';
        table_myOrders += '<form id="dispdownform" class="inline" action="/orders" method="post"><input name="order" type="hidden" value="' + row.key + '" /><input name="fnc" type="hidden" value="redeem" /><span class="fa fa-2x fa-thumbs-down thumbsbutton text-red" onclick="$(\'#dispdownform\').submit();"></span></form>';
        table_myOrders += '</td>';
      }
      else {
        //check if key available
        let key = await db.read_key(user, item.hash);
        if(key){
          if (!row.finished && !row.dispute) {
            table_myOrders += '<td>Accepted</td><td><a href="/download?user=' + row.seller + '&hash=' + item.hash + '&finish=' + row.key + '" class="btn btn-sm btn-primary">Download</a>';
            table_myOrders += '<form id="availupform" class="inline"  action="/orders" method="post"><input name="order" type="hidden" value="' + row.key + '" /><input name="fnc" type="hidden" value="finish" /><span class="fa fa-2x fa-thumbs-up thumbsbutton text-green" onclick="$(\'#availupform\').submit();"></span></form>';
            table_myOrders += '<form id="availdownform" class="inline"  action="/orders" method="post"><input name="order" type="hidden" value="' + row.key + '" /><input name="fnc" type="hidden" value="opendispute" /><span class="fa fa-2x fa-thumbs-down thumbsbutton text-red" onclick="$(\'#availdownform\').submit();"></span></form></td>';
          }
          else
            table_myOrders += '<td>Finished</td><td><a href="/download?user=' + row.seller + '&hash=' + item.hash + '" class="btn btn-sm btn-primary">Download</a></td>';
        }
        else{
          table_myOrders += '<td>Waiting for seller</td><td>No key available</td>'
        }
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