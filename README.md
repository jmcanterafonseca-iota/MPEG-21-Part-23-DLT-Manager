# MPEG-21-Part-23 Smart Contract for Media DLT-Manager

This library allows the deployment and parsing of Smart Contract for Media into an EVM-compatible chain.

## Overview

This repository is structured around the following assets:

* The Smart Contract for Media templates. [./smart-contract-templates](./smart-contract-templates/). It contains the different Smart Contracts and configurations needed to deploy Smart Contracts with [Truffle](https://trufflesuite.com/).

* The library [./lib](./lib/) that provides all the functions needed to proceed to the deployment of the different Smart Contract for media.

* The test folder [./test](./test/) that contains scripts that call, test and exercise the library methods. For the Koreny dataset purposes the main script is [./test/deploy-contract-koreny.js](./test/deploy-contract-koreny.js) that allows to deploy a Smart Contract for Media already generated using the [MCO Parser](https://github.com/iotaledger/MPEG-21-Part-23-MCO-Parser). For the Koreny dataset this [script](https://github.com/iotaledger/ebsi-stardust-components/blob/master/demos/ipr-use-case/european-ghosts/generate-all.sh) at the EBSI PCP Stardust components repository allows to generate the Media Contractual objects from Contract Semantic descriptions of the Koreny dataset.

* The Wallet service code that integrates the [Wallet service prototype](https://github.com/iotaledger/ebsi-stardust-components/blob/master/demos/ipr-use-case/european-ghosts/generate-all.sh) with the DLT Manager so that the EVM addresses of the different stakeholders are properly discovered from the information that is kept by the Wallet. This Wallet service needs an authorization bearer token and is optional for this component, but needed to exercise the Koreny dataset object of the EBSI PCP. 

## Install

```sh
// In the parent folder clone the MCO parser repo
git clone https://github.com/iotaledger/MPEG-21-Part-23-MCO-Parser
// Then clone this repo
git clone https://github.com/iotaledger/MPEG-21-Part-DLT-Manager
cd MPEG-21-Part-DLT-Manager
npm install
```

## Koreny dataset generation (IOTA-EBSI stable network)

The [private keys](https://github.com/iotaledger/ebsi-stardust-components/tree/master/demos/ipr-use-case/european-ghosts/secrets/private-keys.json) referenced in the repository are used mostly for testing purposes at the [smart-contract-templates](./smart-contract-templates/) with Truffle. They can also be used for testing just deployed Smart Contracts to test they behave correctly. However, the Koreny dataset has its own set of EVM addresses used by the different stakeholders. In the [EBSI PCP Stardust](https://github.com/iotaledger/ebsi-stardust-components/tree/master/demos/ipr-use-case/european-ghosts/identity/dataset/claims) repository it can be found the corresponding addresses and private keys.

### Preparation : Build and deploy base Smart Contracts

```sh
cd smart-contract-templates
npm install
```

Then you need to create a `.env` file in the `smart-contract-templates` folder with the following entries:

```sh
IOTA_WASP_MNEMONIC="angle ...... meadow cereal"
IOTA_EVM_ENDPOINT_URL="https://json-rpc.evm.stable.iota-ec.net"
```

representing the mnemonic that will lead to the private key of the address that will fund the Smart Contract creation and the EVM endpoint.

Afterwards, via Truffle, the base Smart Contracts, for instance the Smart Contract that mints the NFTs corresponding to the digital asset generation corresponding to obligations, permissions, etc, can be generated as follows: 

```sh
npx truffle migrate --reset --network stable
```

### Deploy a Smart Contract and NFTs resulting from Media Contractual Object

Ensure you have defined the proper `.env`, including the Mnemonic that will lead to the address and private key that will fund the contract and NFT creation. Alternatively there is the possibility of using the file [private-keys.json](./private-keys-json). The number #0 address must hold enough tokens to fund the gas fees. Also it is needed the endpoint of the WASP Node (JSON-RPC) and the chain ID (network ID). Then, the IPFS gateway URL where to store the NFT metadata of the permissions, obligations and related tokens that represent work arts. And finally, the *Wallet service* and Wallet service token (if needed) where EVM the addresses of the different stakeholders will be obtained.

```sh
IOTA_WASP_MNEMONIC="angle ...... meadow cereal"
IOTA_WASP_CHAIN_ID="1074"
IOTA_EVM_ENDPOINT_URL="https://json-rpc.evm.stable.iota-ec.net"

IPFS_GATEWAY_URL="https://api.ipfs.iota-ec.net"

WALLET_SERVICE_URL="https://wallet-api.stable.iota-ec.net"
WALLET_SERVICE_TOKEN="eyJhbG..."
```

Optionally it can be provided the address of an existing NFT Smart Contract and/or an existing ERC20 token contract to be used. If these environment variables are not defined then these address will be taken from the last migration Truffle process made on the corresponding network.

```sh
NFT_SMART_CONTRACT_ADDR="0x...."
ERC20_TOKEN_SMART_CONTRACT_ADDR="0x...."
```

Finally the following instruction on the command line has to executed.

```sh
 MCO_JSON_FILE='<mco_def_file.json>' PRIVATE_KEYS_FILE='<private_keys_file.json>' TEST_ADDR='<0x1234...>' CONTRACT_TEMPLATE='cascade|default' deploy-contract-koreny npx ts-node ./test/deploy-contract-koreny.js 
```

The private keys file is optional and the test address to pay as well. If the latter is present then a payment will be done to that address through the `payTo` method of the Smart Contract for Media deployed using the funds of the deployer of the Smart Contract.

## Smart Contract Generation Service

Please see [./service](./service).

## Other tests (from the original MPEG project)

### Test

```sh
cd test
// Create a `.env` file containing these informations:
//IOTA_WASP_MNEMONIC="angle ...... meadow cereal"
//IOTA_WASP_CHAIN="tst1pq6hayf.....6pw6mcvre74jzhu4qde"
//IOTA_WASP_CHAIN_ID="1075"
//IOTA_WASP_URL="http://localhost"
ts-node test-iota.js
```

### Build for the web Workbench

```sh
npm run build
```

### Build and deploy smart contracts

```sh
cd smart-contract-templates
npm install
// Create a `.env` file containing these informations:
//IOTA_WASP_MNEMONIC="angle ...... meadow cereal"
//IOTA_WASP_CHAIN="tst1pq6hayf.....6pw6mcvre74jzhu4qde"
//IOTA_WASP_URL="http://localhost"
truffle migrate --reset --network iota
```
