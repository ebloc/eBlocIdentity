const RootStorage = artifacts.require('RootStorage');
const Root = artifacts.require('Root');
const ENSRegistry = artifacts.require('ENSRegistry');
const Resolver = artifacts.require('Resolver');

module.exports = async (deployer, network, accounts) => {
  let resolver, ens, rootStorage;
  await deployer.deploy(Resolver, { from: accounts[0] }).then(instance => {
    resolver = instance;
  });
  await deployer.deploy(ENSRegistry, accounts[0]).then(instance => {
    ens = instance;
    ens.setResolver(web3.utils.fromAscii(''), resolver.address, { from: accounts[0] });
  });
  await deployer.deploy(RootStorage, 2, 5, [accounts[0]]).then(instance => {
    rootStorage = instance;
  });
  await deployer.deploy(Root, ens.address, rootStorage.address).then(instance => {
    resolver.setAddr(web3.utils.fromAscii(''), instance.address, { from: accounts[0] });
  });
};
