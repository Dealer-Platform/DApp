const fs = require('fs');
const config = require('../config.json');

module.exports = {
    readAllKeyPairsFromDisk(fnc) {
        var result = {};
        var localstorage = "";

        fs.readFile(config.key_storage, (err, data) => {
            if (!err) {
                try {
                    localstorage = JSON.parse(data);


                    Object.keys(localstorage).forEach(key => {
                        result[key] = this.stringToBuffer(localstorage[key].toString());
                    });

                    fnc(result);
                } catch (e) {
                    console.log(e);
                }
            } else {
                console.error(err);
            }


        });
    },
    readKeyPairFromDisk(itemKey, fnc) {
        var localstorage = "";

        fs.readFile(config.key_storage, (err, data) => {
            if (!err) {
                try {
                    localstorage = JSON.parse(data);
                    fnc(this.stringToBuffer(localstorage[itemKey].toString()));
                } catch (e) {
                    console.log(e);
                }
            } else {
                console.error(err);
            }


        });
    },
    writeItemKeyPairToDisk(itemKey, fileKey) {
        this.writeToDisk(itemKey, this.bufferToString(fileKey));
    },
    writeToDisk(itemKey, fileKey) {
        var localstorage = "";

        fs.readFile(config.key_storage, (err, data) => {
            if (!err) {
                try {
                    localstorage = JSON.parse(data);
                } catch (e) {
                    console.log(e);
                }
            } else {
                console.error(err);
            }

            localstorage[itemKey] = fileKey;

            var stream = fs.createWriteStream(config.key_storage);
            stream.once('open', function (fd) {
                stream.write(JSON.stringify(localstorage));
                stream.end();
            });

        });
    },
    initKeystoreFile() {
        fs.exists(config.key_storage, function (exists) {
            if (!exists) {
                var stream = fs.createWriteStream(config.key_storage);
                stream.once('open', function (fd) {
                    stream.write("{}");
                    stream.end();
                });
                console.log("init keystore");
            }
        });
    },
    bufferToString(buff) {
        const {StringDecoder} = require('string_decoder');
        const decoder = new StringDecoder('utf16le');
        return decoder.write(buff);
    },
    stringToBuffer(str) {
        return Buffer.from(str, 'utf16le');
    }

//     let fileKey = crypto.randomBytes(32);
//     console.log(fileKey);
// const { StringDecoder } = require('string_decoder');
// const decoder = new StringDecoder('utf16le');
// var str = decoder.write(fileKey);
// console.log(str);
//
// var buf = Buffer.from(str, 'utf16le');
// console.log(buf);

}