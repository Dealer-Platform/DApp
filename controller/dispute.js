const config = require('../config.json');
const nav = require('./parent');
const jsdom = require("jsdom");
const jquery = require("jquery");
const db = require('../logic/ipfs');
const chainwrite = require('../logic/chainwrite');
const chainread = require('../logic/chainread');

const site = "dispute";

module.exports = {

    async handleRequest(req, res) {
        let fnc = req.body.fnc;
        let order = req.body.order;


        if (fnc == "open")
            await chainwrite.opendispute(order);

        if (fnc == "close")
            await chainwrite.closedispute(order);

        if (fnc == "finish")
            await chainwrite.finishorder(order);

        if (fnc == "redeem")
            await chainwrite.redeemorder(order);

        await this.loadPage(res);
    },


//get order page and its buttons
    async loadPage(res, err, done) {
        let orders = nav.load(site);
        let order_items = await chainread.orders();
        let items = await chainread.items();

        let voteassignments = [];

        await chainread.votings().then(voting => {
            for (let i = 0; i < voting.rows.length; i++) {
                let row = voting.rows[i];

                if (row.voter !== config.user)
                    continue;

                voteassignments[row.itemKey] = row;
            }
        });


        let table_dispute = '<table class="table align-items-center table-flush">';
        table_dispute += '<tr><th>Order</th><th>Item</th><th>Reporter</th><th>Name</th><th>Description</th></th><th>Orderdate</th><th>Action</th></tr>';
        for (let i = 0; i < order_items.rows.length; i++) {
            let row = order_items.rows[i];

            //only show disputed incidents
            if (row.dispute == 0 || row.finished == 1)
                continue;

            //only show incidents where user is involved (buyer, seller or verifier)
            if (row.buyer !== config.user && row.seller !== config.user && voteassignments[row.itemKey] != undefined)
                continue;


            let item = items.rows.filter(i => i.key === row.itemKey)[0];

            table_dispute += '<tr>';
            table_dispute += '<td>' + row.key + '</td>';
            table_dispute += '<td>' + row.itemKey + '</td>';
            table_dispute += '<td>' + row.seller + '</td>';
            table_dispute += '<td>' + item.title + '</td>';
            table_dispute += '<td>' + item.description + '</td>';
            table_dispute += '<td>' + row.timestamp + '</td>';


            table_dispute += ` 
            <td><form>
                <input type="submit" class="btn btn-primary" value="Upload Key"/>
            </form></td>
            `;


            table_dispute += '</tr>';
        }
        table_dispute += '</table>';

        //place tables
        let orders_dom = new jsdom.JSDOM(orders);
        let $ = jquery(orders_dom.window);
        $('.table-responsive').html(table_dispute);
        orders = orders_dom.serialize();

        nav.deliver(res, orders, err, done);
    }
};