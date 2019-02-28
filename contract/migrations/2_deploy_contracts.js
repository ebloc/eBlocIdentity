const Root = artifacts.require('Root');

module.exports = async (deployer, network, accounts) => {
  deployer.deploy(Root, 2, 5, [accounts[0]]);
};
