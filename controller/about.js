const nav = require('./parent');
const site = "about";





module.exports = {
//get the about page
    getPageAbout(res) {
    // let head 		= fs.readFileSync(path + 'head.html', 'utf8');
    // let navigation 	= fs.readFileSync(path + 'navigation.html', 'utf8');
    //  let about 		= fs.readFileSync(path + 'about.html', 'utf8');
        nav.deliver(res, nav.load(site));
    // res.send('<!DOCTYPE html><html lang="de">' + template.head() + '<body>' + template.navigation() + site + '</body></html>');
}
};