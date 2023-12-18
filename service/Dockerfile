FROM node:18.18.1-alpine3.17

RUN apk add git

WORKDIR /opt/generator
RUN git clone https://github.com/iotaledger/MPEG-21-Part-23-MCO-Parser
RUN git clone https://github.com/iotaledger/MPEG-21-Part-23-DLT-Manager

WORKDIR /opt/generator/MPEG-21-Part-23-MCO-Parser
RUN npm install

WORKDIR /opt/generator/MPEG-21-Part-23-DLT-Manager
RUN npm install

WORKDIR /opt/generator/MPEG-21-Part-23-DLT-Manager/smart-contract-templates
RUN npm install
RUN npx truffle build

WORKDIR /opt/generator/MPEG-21-Part-23-DLT-Manager/service

EXPOSE 3000

ENTRYPOINT [ "node", "index.js"]
