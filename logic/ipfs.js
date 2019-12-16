const config = require('../config');
var ipfsClient = require('ipfs-http-client');
const ipfs = ipfsClient({
    host: config.IPFS.ip,
    port: config.IPFS.port,
    protocol: 'http'
});

const itemsPath = "/user/items/";
const keysPath = "/user/keys/";

const chain = require('./chainread');

/**
 * Write a single JS object to a JSON file in a local IPFS path (MFS)
 * @param path Path to IPFS folder
 * @param json JS object to convert to json
 * @returns {Promise<Promise|boolean|*|Boolean|void>}
 */
async function writeJson(path, json){
    return ipfs.files.write(path,
        Buffer.from(JSON.stringify(json)),
        {create: true, parents: true});
}

/**
 * Read a single JSON items from an IPFS path
 * @param path Path to IPFS file
 * @returns {Promise<*>}
 */
async function readJsonFile(path) {
    let res = await ipfs.files.read(path);
    return JSON.parse(res.toString());
}

async function readJson(path) {
    let res = await ipfs.get(path);
    return JSON.parse(res[0].content.toString());
}

/**
 * Read all JSON items from an IPFS path
 * @param path Path to IPFS directory
 * @returns {Promise<*>}
 */
async function readJsonDir(path){
    let res = await ipfs.get(path);
    return res.slice(1).map(c => JSON.parse(c.content.toString()))
}

/**
 * Resolves an IPNS entry and pins it locally
 * @param ipns
 * @returns {Promise<void|string>}
 */
async function resolveAndPin(ipns){
    let dir = await ipfs.name.resolve(ipns);
    //await ipfs.pin.add(ipns, { recursive: false }); //recursive:true would pin all items of that user. Future: ipfs name follow?
    return dir;
}

/**
 * Republish IPNS entry and update pin
 */
async function updateFeed(){
    let stat = await ipfs.files.stat("/user");
    console.log('directory: ' + stat.hash);
    return Promise.all([
        ipfs.name.publish(stat.hash),
        ipfs.pin.add(stat.hash)
    ]);
}

/**
 * Retrieve all IPFS items stored under a single user's IPNS entry
 * @param user Blockchain user entry
 * @returns {Promise<*>}
 */
async function getUserItems(user){
    let dir = resolveAndPin(user.ipns);
    let items = await readJsonDir(dir + '/items/');
    let keys = await readJsonDir(dir + '/keys/');

    //add each key to items by _id
    keys.forEach(key => {
        let item = items.find(item => {
            return key._id === item._id;
        });
        if(item) item.fileKeys = key.fileKeys;
    });

    return items;
}


module.exports = {

    async read_item() {
        return getUserItems(config.user);
    },

    async read_own_key(hash){
        let result = await readJsonFile(keysPath + hash);
        let key = result.fileKeys.find(key => key.user === config.user);
        return key.encryptedFileKey;
    },

    async read_key(user, hash){
        let dir = await resolveAndPin(user.ipns);
        let result = await readJson(dir + '/keys/' + hash);
        let key = result.fileKeys.find(key => key.user === config.user);
        return key.encryptedFileKey;
    },


    async read_all_items() {
        let users = (await chain.users()).rows;
        return [].concat.apply([],
          await Promise.all(users.map(getUserItems))
        );
    },

    async read_item_byID(user, hash) {
        let dir = await resolveAndPin(user.ipns);
        let item = await readJson(dir + '/items/' + hash);
        let key = await readJson(dir + '/keys/' + hash);
        item.fileKeys = key;
        return item;
    },

    async write_report(encryptedData, hashEncryptedData, encryptedFileKey, init_vector, itemType, title, description, industry) {
        let incident =  {
            _id:hashEncryptedData, encryptedData:encryptedData, init_vector:init_vector,
            itemType:itemType, title:title, description:description, industry:industry
        };
        let fileKey = { _id: hashEncryptedData, fileKeys: [{ encryptedFileKey:encryptedFileKey, user:config.user }] };

        await Promise.all([
            writeJson(itemsPath + hashEncryptedData, incident),
            writeJson(keysPath + hashEncryptedData, fileKey)
        ]);

        await updateFeed();
    },

  /**
   * Adds encrypted file keys to IPFS
   * @param hash
   * @param keys array of objects with user, sender, encryptedFileKey
   * @returns {Promise<void>}
   */
    async write_addEncryptedFileKeys(hash, keys) {
        let path = keysPath + hash;

        let json = await readJsonFile(path);
        json.fileKeys = json.fileKeys.concat(keys);

        await writeJson(path, json);
        await updateFeed();
    }
};