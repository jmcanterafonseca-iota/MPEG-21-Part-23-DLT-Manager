class OffChainStorage {
  constructor() {
    this.helia = {};
    this.jsonHelia = {};
    this.CID = {};
  }

  async start() {
    const { createHelia } = await import('helia');
    const { json } = await import('@helia/json');
    const { CID } = await import('multiformats/cid');

    this.helia = await createHelia();
    this.jsonHelia = json(this.helia);
    this.CID = CID;
  }

  async publish(payload) {
    console.log('[IPFS] Publishing payload');
    if (typeof payload !== 'object') payload = { payload };
    const result = 'ipfs://' + (await this.jsonHelia.add(payload)).toString();
    console.log('[IPFS] Published ', result);
    return result;
  }

  async retrieve(cid) {
    console.log('[IPFS] Retrieving ', cid);
    cid = cid.split('/').slice(-1)[0];
    const parsedCID = this.CID.parse(cid);
    return await this.jsonHelia.get(parsedCID);
  }

  async stop() {
    await this.helia.stop();
  }
}

module.exports = { OffChainStorage };
