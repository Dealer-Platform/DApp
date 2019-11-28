const config = require('../config');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const url_mongo = 'mongodb://' + config.MongoDB.ip + ':' + config.MongoDB.port;

module.exports = {
    read_item() {
        return new Promise(function (resolve, reject) {
            MongoClient.connect(url_mongo, {useNewUrlParser: true}, function (err, client) {
                assert.equal(null, err);
                console.log("Connected successfully to MongoDB Container");
                const db = client.db('reporting');
                const collection = db.collection('item');
                collection.find({}).toArray(function (err, docs) {
                    assert.equal(err, null);
                    resolve(docs);
                });
                client.close();
            });
        });
    },
    read_item_byID(key) {
        return new Promise(function (resolve, reject) {
            MongoClient.connect(url_mongo, {useNewUrlParser: true}, function (err, client) {
                assert.equal(null, err);
                console.log("Connected successfully to MongoDB Container");
                const db = client.db('reporting');
                const collection = db.collection('item');
                collection.find({_id: key}).toArray(function (err, docs) {
                    assert.equal(err, null);
                    resolve(docs);
                });
                client.close();
            });
        });
    },


    write_report(encryptedData, hashEncryptedData, encryptedFileKey, init_vector, title, description, industry) {
        return new Promise(function (resolve, reject) {
            MongoClient.connect(url_mongo, {useNewUrlParser: true}, function (err, client) {
                assert.equal(null, err);
                console.log("Connected successfully to MongoDB Container");
                const db = client.db('reporting');
                const collection = db.collection('item');
                collection.insertOne({
                        _id: hashEncryptedData, encryptedData: encryptedData,
                        fileKeys: [{encryptedFileKey: encryptedFileKey, user: config.user}], init_vector: init_vector,
                        title: title, description: description, industry: industry
                    },
                    function (err, result) {
                        assert.equal(err, null);
                        assert.equal(1, result.result.n);
                        assert.equal(1, result.ops.length);
                        console.log("Inserted 1 document into the item collection");
                        resolve(result);
                    }
                );

                client.close();
            });
        });
    },
    write_addEncryptedFileKey(hash, user, encryptedFileKey) {
        return new Promise(function (resolve, reject) {
            MongoClient.connect(url_mongo, {useNewUrlParser: true}, function (err, client) {
                assert.equal(null, err);
                console.log("Connected successfully to MongoDB Container");
                const db = client.db('reporting');
                const collection = db.collection('item');
                collection.updateOne({_id: hash}, {$push: {fileKeys: {encryptedFileKey: encryptedFileKey, user: user}}},
                    function (err, result) {
                        assert.equal(err, null);
                        assert.equal(1, result.result.n);
                        console.log("Inserted 1 encryptedFileKey into the items collection");
                        resolve(result);
                    }
                );
                client.close();
            });
        });
    }
};