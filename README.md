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

## Koreny dataset generation (IOTA-EBSI stable network)

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

Ensure you have defined the proper `.env`, including the Mnemonic that will lead to the address and private key that will fund the contract and NFT creation. Such an address must hold enough tokens to fund the gas fees. Also it is needed the endpoint of the WASP Node (JSON-RPC) and the chain ID (network ID). Then, the IPFS gateway URL where to store the NFT metadata of the permissions, obligations and related work arts. And finally, the Wallet service and Wallet service token (if needed) where EVM the addresses of the different stakeholders will be obtained.

```sh
IOTA_WASP_MNEMONIC="angle ...... meadow cereal"
IOTA_WASP_CHAIN_ID="1074"
IOTA_EVM_ENDPOINT_URL="https://json-rpc.evm.stable.iota-ec.net"

IPFS_GATEWAY_URL="https://api.ipfs.iota-ec.net"

WALLET_SERVICE_URL="https://wallet-api.stable.iota-ec.net"
WALLET_SERVICE_TOKEN="eyJhbG..."
```

```sh
npx ts-node ./test/deploy-contract.js <path_to_the_MediaContractual_Object.json> 
```

## Other tests (from the original MPEG project)

### Test

```
cd test
// Create a `.env` file containing these informations:
//IOTA_WASP_MNEMONIC="angle ...... meadow cereal"
//IOTA_WASP_CHAIN="tst1pq6hayf.....6pw6mcvre74jzhu4qde"
//IOTA_WASP_CHAIN_ID="1075"
//IOTA_WASP_URL="http://localhost"
ts-node test-iota.js
```

### Build for the web Workbench

```
npm run build
```

### Build and deploy smart contracts

```
cd smart-contract-templates
npm install
// Create a `.env` file containing these informations:
//IOTA_WASP_MNEMONIC="angle ...... meadow cereal"
//IOTA_WASP_CHAIN="tst1pq6hayf.....6pw6mcvre74jzhu4qde"
//IOTA_WASP_URL="http://localhost"
truffle migrate --reset --network iota
```
