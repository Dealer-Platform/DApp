# DEALER-Platform DApp
This project is the decentralized application for the EOS blockchain-based threat intelligence sharing platform DEALER.
It is based on a nodeJS express webserver communicating with the EOS blockchain via RPC and with IPFS via HTTP.

![Logo](./views/assets/img/brand/blue.png)
## Project setup
```
npm install
```

### Prerequisites
1. Install EOS Studio for a local test environment and set up the contract from https://github.com/dealer-platform/smartcontract. 
Register the users you intend to use in the DApp, compile and deploy the smart contract and you are ready to go.
2. Set up a local IPFS node, for example based on https://github.com/ipfs/go-ipfs. 

### Configuration
Add `config.json` based on `config.json.example`. Replace publicKey_eos and privateKey_eos with the keypair configured in EOS Studio. Finally, configure the IPFS node IP and port for your local node.

### Run
`npm run serve`

or 

`node app.js`

The webserver is then running at `localhost` Port 80 and the DApp UI can be opened in the browser.