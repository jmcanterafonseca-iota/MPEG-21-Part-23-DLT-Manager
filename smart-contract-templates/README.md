# How to deploy smart contracts

Create a `.env` file containing these informations:

```
IOTA_WASP_MNEMONIC="angle ...... meadow cereal"
IOTA_WASP_CHAIN="tst1pq6hayf.....6pw6mcvre74jzhu4qde"
```

Execute

```
truffle migrate --reset --network iota
```
