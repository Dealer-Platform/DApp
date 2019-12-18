const template = require('./parent');
const path = __dirname + '/views/';
const site = path +"home.html";
const nav = require('./parent');

module.exports = {
//ASSEMBLE PAGES
    getPageHome(res) {
    // let head 		= fs.readFileSync(path + 'head.html', 'utf8');
    // let navigation 	= fs.readFileSync(path + 'navigation.html', 'utf8');
    // let home 		= fs.readFileSync(path + 'home.html', 'utf8');
        nav.deliver(res);
}
};