const crypto = require('../logic/cryptofunctions')
const db = require('../logic/ipfs')
const chainread = require('../logic/chainread')
const config = require('../config');

async function getAndDecrypt(chainUser, hash){
  let item = await db.read_item_byID(chainUser, hash)
  //let ownFileKey = item.fileKeys.fileKeys.filter(f => f.user === config.user)[0].encryptedFileKey;
  let ownFileKey = item.fileKeys.fileKeys[0].encryptedFileKey;
  let key = crypto.decryptRSA(ownFileKey, config.privateKey_mongo)
  return crypto.decryptAES(item.encryptedData, key, item.init_vector);
}

module.exports = {

  async handleRequest(req, res, next){
    let user = req.query.user;
    let hash = req.query.hash;

    if(!hash){
      let itemKey = req.query.key;
      let items = await chainread.items_byKey(itemKey)
      hash = items.rows[0].hash;
    }

    let chainUsers = await chainread.users_byUser(user);

    try {
      let decrypted = await getAndDecrypt(chainUsers.rows[0], hash);
      res.attachment('item.txt')
      res.type('text')
      res.send(decrypted)
    }
    catch(err){
      next(err);
    };
  }
}