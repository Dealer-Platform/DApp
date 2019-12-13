const config = require('../config');
const crypto = require('crypto');


module.exports = {
    randomBytes(count) {
        return crypto.randomBytes(count);
    },
    getCryptoRandom(size) {
        const buf = Buffer.alloc(size);
        return crypto.randomFillSync(buf).toString('hex');
    },
    hashSHA256(text) {
        return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
    },
    encryptAES(text, key) {
        const iv = crypto.randomBytes(16);
        //ISO/IEC 10116:2017
        let cipher = crypto.createCipheriv('aes-256-ctr', Buffer.from(key), iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return {iv: iv.toString('hex'), encryptedData: encrypted.toString('hex')};
    },
    decryptAES(text, key, init_vector) {
        let iv = Buffer.from(init_vector, 'hex');
        let encryptedText = Buffer.from(text, 'hex');
        let decipher = crypto.createDecipheriv('aes-256-ctr', Buffer.from(key), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    },

    encryptRSA(toEncrypt, publicKey) {
        let key = "-----BEGIN PUBLIC KEY-----\n" + publicKey + "\n-----END PUBLIC KEY-----\n";

        const buffer = Buffer.from(toEncrypt, 'utf8')
        const encrypted = crypto.publicEncrypt(key, buffer)
        return encrypted.toString('base64')
    },

    decryptRSA(toDecrypt, privateKey) {
        let key = "-----BEGIN ENCRYPTED PRIVATE KEY-----\n" + privateKey + "\n-----END ENCRYPTED PRIVATE KEY-----\n"

        const buffer = Buffer.from(toDecrypt, 'base64');
        const decrypted = crypto.privateDecrypt(
            {
                key: privateKey,
                passphrase: config.passphrase_RSA,
            },
            buffer
        );

        return decrypted
    },

    calculateKeyPair(passphrase) {
        const {generateKeyPairSync}  = require('logic/cryptofunctions');
        return generateKeyPairSync('rsa', {
            modulusLength: 4096,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem',
                cipher: 'aes-256-cbc',
                passphrase: passphrase
            }
        });
    }
};


