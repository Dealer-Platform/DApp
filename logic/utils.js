module.exports = {
  //from https://stackoverflow.com/a/1199420/5726546
  truncate(str, n){
    return (str.length > n) ? str.substr(0, n-1) + '&hellip;' : str;
  }
}