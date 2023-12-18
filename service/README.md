# Generator service

This folder contains a simple REST service that allows to generate and deploy Smart Contracts for Media (SCM) and follow the progress of the generation and deployment task. It is intended to be used by the IPR Marketplace Web App.

It depends on the [MCO Parser](https://github.com/iotaledger/MPEG-21-Part-23-MCO-Parser) and the DLT Manager projects (this project).

The services offers the following [endpoints](#endpoints).

## Configure the service

See the [environment template](config.env.template). Additionally you may need a set of private keys already funded such as the set [here](https://github.com/iotaledger/ebsi-stardust-components/blob/master/demos/ipr-use-case/european-ghosts/secrets/private-keys.json).

## Start the service

```sh
node ./index.js
```

or through [docker compose](./docker-compose.yaml).

## Endpoints

### SCM Generation endpoint

`POST /generate-contract`

Allows to generate a SCM and deploy it.

Two different JSON payloads are accepted:

A request that contains an Media Contractual Object represented as JSON together with options:

```json
{
    "options": {
        "requestId": "123456",
        "contractTemplate": "cascade"
    },

    "mediaContractualObjects": {

    }
}
```

* `options.requestId` Indicates the request ID that will be used later to follow the progress. 
* `options.contractTemplate`: Indicates a template of Smart Contract to be used. By default is the `default` template.

Another alternative is to directly request the transformation of a TTL (Turtle) into a Smart Contract specification that ultimately is deployed. The Turtle content has to be *serialized as a valid JSON string* under the `turtle.value` member.

```json
{
    "options": {
        "requestId": "123456",
        "contractTemplate": "cascade"
    },

    "turtle": {
        "value": "@prefix ...."
    }
}
```

After receiving the request and accepting it (`202` HTTP status) the service will asynchronously start a new task to proceed. Such a task may take several minutes.

### SCM generation and deployment progress following through Websocket

The progress of the generation and deployment task can be followed through a Web Socket by opening a Web socket connection against the endpoint, before requesting a new SCM generation. The endpoint is:

`ws://<service>//progress/{requestId}`

where `requestId` must match the requestId that is going to be used to proceed to the generation and deployment (see above). 
Please note that in order to follow the progress correctly the Websocket connection must be open *before calling `generate-contract`*.

For marking an error an `<error>` tag will be received in a line followed by the error and finally a `</error>` tag.

For marking the completion of the task a `<success>` tag must be expected. The address of the SCM generated will be found under a line received by the Web Socket containing the following JSON string:

```json
{
    "smartContractAddress": "0x..."
}
```
