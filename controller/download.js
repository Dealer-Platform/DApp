const crypto = require('../logic/cryptofunctions');
const db = require('../logic/ipfs');
const chainread = require('../logic/chainread');
const filter = require('../logic/filter')
const config = require('../config');

/**
 * Attempt to decrypt an on-chain item using keys provided by others
 * @param users All users providing keys for this item
 * @param hash Item hash
 * @returns {Promise<void>}
 */
async function getAndDecrypt(users, hash){
  let item_promise = db.read_item(users[0], hash);
  let keys_promise = Promise.all(users.map(user => db.read_key(user, hash)));
  let [item, keys] = await Promise.all([item_promise, keys_promise])
  keys = keys.filter(k => k !== undefined);
  let decrypted = undefined;
  for(const key of keys){
    try{
      decrypted = decrypt(key, item);
      break;
    }
    catch(err){}
  }
  return new Promise((resolve, reject) => {
    if(decrypted) resolve(decrypted);
    else reject("Retrieved " + keys.length +  " keys from " + users.length + ". Could not decrypt")
  });
}

function decrypt(fileKey, item){
  let key = crypto.decryptRSA(fileKey, config.privateKey_RSA);
  return crypto.decryptAES(item.encryptedData, key, item.init_vector);
}

module.exports = {

  async handleRequest(req, res, next){
    let user = req.query.user;
    let hash = req.query.hash;
    let dispute = req.query.dispute;

    if(!hash){
      let itemKey = req.query.key;
      let items = await chainread.items_byKey(itemKey);
      hash = items.rows[0].hash;
    }

    let users = [user];
    if(dispute){
      //get verifier keys
      let votings = await chainread.votings();
      let assignedUsers = filter.voters_byItem(votings, dispute);
      users = users.concat(assignedUsers)
    }

    let chainUsers = await Promise.all(users.map(chainread.users_byUser));
    try {
      let decrypted = await getAndDecrypt(chainUsers, hash);
      res.attachment(hash + '.txt');
      res.type('text');
      res.send(decrypted)
    }
    catch(err) {
      console.log(err)
      res.redirect(req.header('Referer'))
    }
  }
};