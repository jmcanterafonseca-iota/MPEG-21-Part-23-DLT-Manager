# How to deploy the base smart contracts of the IPR Use Case

## Koreny dataset : IOTA-EBSI stable network

Create a `.env` file with the following entries:

```sh
IOTA_WASP_MNEMONIC="angle ...... meadow cereal"
IOTA_EVM_ENDPOINT_URL="https://json-rpc.evm.stable.iota-ec.net"
```

Afterwards execute

```sh
npx truffle migrate --reset --network stable
```

## Other tests

Create a `.env` file containing these informations:

```
IOTA_WASP_MNEMONIC="angle ...... meadow cereal"
IOTA_WASP_CHAIN="tst1pq6hayf.....6pw6mcvre74jzhu4qde"
```

Execute

```
truffle migrate --reset --network iota
```
