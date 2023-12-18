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

`--reset` can be optional in incremental migrations and only needed to ensure everything is redeployed regardless current state.

At the moment the mnemonic is no longer needed if a `private-keys.json` file exists at the parent folder. An example, with address already funded, `private-keys.json` file can be found [here](https://github.com/iotaledger/ebsi-stardust-components/blob/master/demos/ipr-use-case/european-ghosts/secrets/private-keys.json).

## Functional testing execution

```sh
npx truffle test --network stable
```

## Other tests (from the original MPEG project)

Create a `.env` file containing these informations:

```
IOTA_WASP_MNEMONIC="angle ...... meadow cereal"
IOTA_WASP_CHAIN="tst1pq6hayf.....6pw6mcvre74jzhu4qde"
```

Execute

```
truffle migrate --reset --network iota
```
