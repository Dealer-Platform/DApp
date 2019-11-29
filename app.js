const express = require('express');
const fs = require('fs');
global.viewsdir = __dirname + "/views/";

//eosjs
// const { Api, JsonRpc, RpcError } = require('eosjs');
// const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');
//load custom config file
const config = require('./config.json');
//manipulate html
const jsdom = require("jsdom");
const jquery = require("jquery");

const app = express();
const router = express.Router();
const path = __dirname + '/views/';
const port = 8080;

//controller
const c_home = require('./controller/home');
const c_report = require('./controller/report');
const c_marketplace = require('./controller/marketplace');
const c_view = require('./controller/view');
const c_orders = require('./controller/orders');
const c_orderarchive = require('./controller/orderarchive');
const c_verify = require('./controller/verify');
const c_blame = require('./controller/blame');
const c_mypage = require('./controller/mypage');
const c_about = require('./controller/about');
const c_download = require('./controller/download');
const c_warnings = require('./controller/warnings');
const c_warningreport = require('./controller/warningreport');

router.use(function (req, res, next) {
     console.log('/' + req.method);
    next();
});


//GET ENDPOINTS: MANAGE ROUTING
router.get('/', function (req, res) {
    res.redirect('/marketplace');
});
router.get('/home', function (req, res) {
    c_home.getPageHome(res);
});
router.get('/report', function (req, res) {
    c_report.loadPage(res);
});
router.get('/marketplace', function (req, res) {
    c_marketplace.loadPage(res);
});
router.get('/view', function (req, res) {
    c_view.loadPage(res);
});
router.get('/orders', function (req, res) {
    c_orders.loadPage(res);
});
router.get('/orderarchive', function (req, res) {
    c_orderarchive.loadPage(res);
});
router.get('/verify', function (req, res) {
    c_verify.loadPage(res);
});
router.get('/blame', function (req, res) {
    c_blame.loadPage(res);
});
router.get('/mypage', function (req, res) {
    c_mypage.loadPage(res);
});
router.get('/about', function (req, res) {
    c_about.getPageAbout(res);
});
router.get('/download', function(req, res, next) {
    c_download.handleRequest(req, res, next)
});
router.get('/warnings', function(req, res, next) {
    c_warnings.loadPage(res)
});
router.get('/warningreport', function(req, res, next) {
    c_warningreport.loadPage(res)
});


app.use(express.static(path));
app.use('/', router);

app.listen(port, function () {
    console.log("webserver at localhost:8080, Don't forget to configure the config-emma.json!");
});


//POST ENDPOINTS: MANAGE FORMS
app.use(express.urlencoded({extended: true}));
//Mange the report form
app.post('/report', (req, res) => {
    c_report.handleRequest(req, res);
});
//manage mypage form (generating key pairs)
app.post('/mypage', (req, res) => {
    c_mypage.handleRequest(req, res);
});
app.post('/verify', (req, res) => {
    c_verify.handleRequest(req, res);
});
//manage blame form
app.post('/blame', (req, res) => {
    c_blame.handleRequest(req, res);
});
//manage the dashboard form(s)
app.post('/marketplace', (req, res) => {
    c_marketplace.handleRequest(req, res);
});
//manage orders
app.post('/orders', (req, res) => {
    c_orders.handleRequest(req, res);
});
app.post('/warningreport', (req, res) => {
    c_warningreport.handleRequest(req, res);
});
app.post('/warnings', (req, res) => {
    c_warnings.handleRequest(req, res);
});
// var ipfsClient = require('ipfs-http-client')
// const ipfs = ipfsClient({ host: '132.199.123.57', port: '5001', protocol: 'http' })
// const ipfs2 = ipfsClient({ host: '132.199.123.236', port: '5001', protocol: 'http' })

//doStuff();

async function doStuff(){
    let itemId = "abc";
    let fileKey = {hash: "0abdef", fileKeys: [{ id: "abc", file: "def"},{ id: "abc2", file: "def2"}]}
    // let fileKeys = 	{
    //     path: "/keys/def", // The file path
    //     content: Buffer.from(JSON.stringify(fileKey))
    // };
    // await ipfs.files.mkdir("/user/keys", { parents: true })
    // await ipfs.files.mkdir("/user/items");

    // let user = await ipfs.files.stat("/user");
    // console.log(user);
    // let res = await ipfs.name.publish(user.hash)
    // console.log(res)

    //let res = await ipfs2.ls('QmdusHdrWSgSrm43AK9G2KpWsWV2m4Xe4THjn1mvqz2mYV/items')
    //let files = res.map(f => f.name); //extract list of hashes
    //
    // let items = [{_id: 'abc', fruit: "grape"},{_id: 'def', fruit: "grape"}]
    // let keys = [{_id: 'abc', fileKeys: [{key: "a"}, {key:"b"}]}, {_id: 'abce', fileKeys: [{key: "a"}, {key:"b"}]}]
    // keys.forEach(key => {
    //     let item = items.find(item => {
    //         return key._id === item._id;
    //     });
    //     if(item) item.fileKeys = key.fileKeys;
    // });
    //
    // console.log(items)
    //console.log(JSON.parse(file[0].content.toString()));

    // let res = await ipfs.files.ls(path);
    // console.log(res)

    // let stats = await ipfs.files.stat(path).catch((err) => {
    //     ipfs.files.mkdir(path, {parents: true}).then(() => {
    //         return ipfs.files.stat(path);
    //     });
    // }).then((res) => { console.log(res) });

    //await ipfs.files.write("/user/keys/" + itemId,Buffer.from(JSON.stringify(fileKey)), {create: true})
    //let result = await ipfs.files.stat("/user"); console.log(result);
    // let result = await ipfs.files.stat("/usr", (err, res) => {
    //    if(err) console.log("hi");
    //    else console.log(res);
    // });
    // console.log(result)
    // result = await ipfs.files.stat("/keys"); console.log(result);
}
// let res = ipfs.files.read("/test", (error, buf) => {
//     console.log(buf.toString('utf8'))
// })
// ipfs.files.write("/test", Buffer.from('Hello, world 2!'))
// res = ipfs.files.read("/test", (error, buf) => {
//     console.log(buf.toString('utf8'))
// })