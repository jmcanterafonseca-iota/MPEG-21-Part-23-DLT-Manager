const { OffChainStorage } = require('../src');

const main = async () => {
  const a = new OffChainStorage();
  await a.start();
  const b = await a.publish('a');
  const c = await a.retrieve(
    'ipfs://bagaaiera7ubdlch63c5u5hlp6g62au6emo3z7g7tnkoiuiknozp3ktzmjwra'
  );
  a.stop();

  console.log(c);
};

main();
