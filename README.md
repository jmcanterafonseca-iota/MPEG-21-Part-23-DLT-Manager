# MPEG-21-Part-23 Smart Contract for Media DLT-Manager

This library allows the deployment and parsing of Smart Contract for Media into an EVM-compatible chain.

## Install

```
// In the parent folder clone the MCO parser repo
git clone https://github.com/iotaledger/MPEG-21-Part-23-MCO-Parser
// Then clone this repo
git clone https://github.com/iotaledger/MPEG-21-Part-DLT-Manager
cd MPEG-21-Part-DLT-Manager
npm install
```

## Test

```
cd test
// Create a `.env` file containing these informations:
//IOTA_WASP_MNEMONIC="angle ...... meadow cereal"
//IOTA_WASP_CHAIN="tst1pq6hayf.....6pw6mcvre74jzhu4qde"
//IOTA_WASP_CHAIN_ID="1075"
//IOTA_WASP_URL="http://localhost"
ts-node test-iota.js
```

## Build for web

```
npm run build
```

## Build and deploy smart contracts

```
cd smart-contract-templates
npm install
// Create a `.env` file containing these informations:
//IOTA_WASP_MNEMONIC="angle ...... meadow cereal"
//IOTA_WASP_CHAIN="tst1pq6hayf.....6pw6mcvre74jzhu4qde"
//IOTA_WASP_URL="http://localhost"
truffle migrate --reset --network iota
```
