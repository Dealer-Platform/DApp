module.exports = {
  //from https://stackoverflow.com/a/1199420/5726546
  truncate(str, n){
    return (str.length > n) ? str.substr(0, n-1) + '&hellip;' : str;
  },

  innerJoin(xs, ys, sel) {
    return xs.reduce((zs, x) =>
        ys.reduce((zs, y) =>        // cartesian product - all combinations
                zs.concat(sel(x, y) || []), // filter out the rows and columns you want
            zs), [])
  }
}