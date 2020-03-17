const config = require('../config');
const first = require('it-first');
const all = require('it-all');
const concat = require('it-concat');
const BufferList = require('bl/BufferList');
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
 * Read a single JSON item from an IPFS Files path
 * @param path Path to local IPFS file
 * @returns {Promise<*>}
 */
async function readJsonFile(path) {
    const chunks = [];
    for await (const chunk of ipfs.files.read(path)) {
        chunks.push(chunk)
    }
    return JSON.parse(Buffer.concat(chunks).toString());
}

/**
 * Read a single JSON item from any IPFS path
 * @param path Path to any IPFS file
 * @returns {Promise<*>}
 */
async function readJson(path) {
    for await (const file of ipfs.get(path)) {
        const content = new BufferList();
        for await (const chunk of file.content) {
            content.append(chunk)
        }
        return JSON.parse(content.toString())
    }
}

/**
 * Read all JSON items from an IPFS path
 * @param path Path to IPFS directory
 * @returns {Promise<*>}
 */
async function readJsonDir(path){
    let files = await all((async function * () {
        for await (let { content } of ipfs.get(path)) {
            content = content ? (await concat(content)).toString() : null;
            yield { content }
        }
    })());
    return files.slice(1).map(c => JSON.parse(c.content.toString()))
}

/**
 * Resolves an IPNS entry and pins it locally
 * @param ipns
 * @returns {Promise<void|string>}
 */
async function resolveAndPin(ipns){
    let dir = await first(ipfs.name.resolve(ipns));
    //await ipfs.pin.add(ipns, { recursive: false }); //recursive:true would pin all items of that user. Future: ipfs name follow?
    return dir;
}

/**
 * Republish IPNS entry and update pin
 */
async function updateFeed(){
    let stat = await ipfs.files.stat("/user");
    console.log('directory: ' + stat.cid.toString());
    return Promise.all([
        ipfs.name.publish(stat.cid),
        ipfs.pin.add(stat.cid)
    ]);
}

/**
 * Retrieve all IPFS items stored under a single user's IPNS entry
 * @param user Blockchain user entry
 * @returns {Promise<*>}
 */
async function getUserItems(user){
    let dir = await resolveAndPin(user.ipns);
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

    async read_user_items(user) {
        return getUserItems(user);
    },

    async read_own_key(hash){
        let result = await readJsonFile(keysPath + hash);
        let key = result.fileKeys.find(key => key.user === config.user);
        return key.encryptedFileKey;
    },

    async read_key(user, hash){
        let dir = await resolveAndPin(user.ipns);
        let key = undefined;
        try {
            let result = await readJson(dir + '/keys/' + hash);

            key = result.fileKeys.find(key => key.user === config.user).encryptedFileKey;
        }
        catch(err){ console.log(err) }
        return key;
    },

    async read_all_items() {
        let users = (await chain.users()).rows;
        return [].concat.apply([],
          await Promise.all(users.map(getUserItems))
        );
    },

    async read_item(user, hash) {
        let dir = await resolveAndPin(user.ipns);
        return readJson(dir + '/items/' + hash);
    },

    async write_report(encryptedData, hashEncryptedData, encryptedFileKey, init_vector, itemType, title, description, industry) {
        try {
            let result = await ipfs.files.stat(itemsPath + hashEncryptedData, {hash: true});
            if(result) {
                return Promise.reject("Item already exists");
            }
        } catch(err){}

        let incident =  {
            _id:hashEncryptedData, encryptedData:encryptedData, init_vector:init_vector,
            itemType:itemType, title:title, description:description, industry:industry
        };
        let fileKey = { _id: hashEncryptedData, fileKeys: [{user:config.user, encryptedFileKey:encryptedFileKey}] };

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

        //don't add duplicates
        let users = json.fileKeys.map(k => k.user);
        keys = keys.filter(k => users.indexOf(k.user) === -1);

        json.fileKeys = json.fileKeys.concat(keys);

        await writeJson(path, json);
        await updateFeed();
    }
};