const config = require('../config.json');
const nav = require('./parent');
const jsdom = require("jsdom");
const jquery = require("jquery");
const site = "mypage";
const chainread = require('../logic/chainread');
const ipfs = require('../logic/ipfs')

module.exports = {
    handleRequest(req, res) {

    },
    async loadPage(res, err, done) {
        let mypage = nav.load(site);

        let ordercount = 0;
        let orders = chainread.orders().then(order => {
            ordercount = order.rows.filter(row => row.buyer === config.user).length;
        });

        let reportcount = 0;
        let items = chainread.items().then(item => {
            reportcount = item.rows.filter(row => row.reporter === config.user).length;
        });

        let analysiscount = 0;
        let votings = chainread.votings().then(voting => {
            analysiscount = voting.rows.filter(row => row.voter === config.user).length;
        });

        let [ ,,, user, ipfs_id ] = await Promise.all([
          orders,
          items,
          votings,
          chainread.users_byUser(config.user),
          ipfs.get_id()
        ])
        let warning = ipfs_id.id === user.ipns ? "" : " <br><span style='color:red'> " +
          "<strong>Warning</strong>: Configured IPFS node and IPNS entry in contract do not match: <br>" +
          "<code>" + ipfs_id.id +"</code> (Config)<br>" +
          "<code>" + user.ipns + "</code> (Contract)</span>";

        let mypage_dom = new jsdom.JSDOM(mypage);
        let $ = jquery(mypage_dom.window);
        $('.reportcount').html(reportcount);
        $('.analysiscount').html(analysiscount);
        $('.ordercount').html(ordercount);
        $('.currusername').html(config.user);
        $('#userlogo').attr("src", "../assets/img/theme/"+config.user+".jpg");
        $('#warning').html(warning)
        $('#eosapi').html(config.Nodeos.ip)
        $('#ipfsapi').html(config.IPFS.ip)

        $('#currentbalance').text(user.balance);

        mypage = mypage_dom.serialize();

        nav.deliver(res, mypage);
    }
};