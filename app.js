const express = require('express');
global.viewsdir = __dirname + "/views/";
const localdb = require('./logic/localdb');

const app = express();
const router = express.Router();
const path = __dirname + '/views/';
const port = 80;

app.use(logResponseTime);

//controller
const c_home = require('./controller/home');
const c_report = require('./controller/report');
const c_marketplace = require('./controller/marketplace');
const c_dispute = require('./controller/dispute');
const c_view = require('./controller/view');
const c_orders = require('./controller/orders');
const c_verify = require('./controller/verify');
const c_blame = require('./controller/blame');
const c_mypage = require('./controller/mypage');
const c_about = require('./controller/about');
const c_download = require('./controller/download');
const c_warnings = require('./controller/warnings');
const c_warningreport = require('./controller/warningreport');

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
router.get('/dispute', function (req, res) {
    c_dispute.loadPage(res);
});
router.get('/view', function (req, res) {
    c_view.loadPage(res);
});
router.get('/orders', function (req, res) {
    c_orders.loadPage(res);
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
router.get('/download', function (req, res, next) {
    c_download.handleRequest(req, res, next)
});
router.get('/warnings', function (req, res, next) {
    c_warnings.loadPage(res)
});
router.get('/warningreport', function (req, res, next) {
    c_warningreport.loadPage(res)
});


app.use(express.static(path));
app.use('/', router);

app.listen(port, function () {
    console.log("webserver at localhost:80, Don't forget to configure the config.json!");
});


//POST ENDPOINTS: MANAGE FORMS
app.use(express.urlencoded({extended: true, limit: '20mb'}));
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
app.post('/view', (req, res) => {
    c_view.handleRequest(req, res);
});
//manage blame form
app.post('/blame', (req, res) => {
    c_blame.handleRequest(req, res);
});
//manage the dashboard form(s)
app.post('/marketplace', (req, res) => {
    c_marketplace.handleRequest(req, res);
});
//manage disputes
app.post('/dispute', (req, res) => {
    c_dispute.handleRequest(req, res);
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

localdb.initKeystoreFile();

function logResponseTime(req, res, next) {
    if(!(req.url.includes('assets') || req.url.includes('slider') || req.url.includes('css'))) {
        const startHrTime = process.hrtime();

        res.on("finish", () => {
            const elapsedHrTime = process.hrtime(startHrTime);
            const elapsedTimeInMs = elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6;
            console.log("%s : %fms", req.path, elapsedTimeInMs);
        });
    }

    next();
}
