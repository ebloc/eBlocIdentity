const DispatcherStorage = artifacts.require('DispatcherStorage');
const Dispatcher = artifacts.require('Dispatcher');
const Root = artifacts.require('Root');
const RootImplementation = artifacts.require('RootImplementation');

module.exports = async (deployer, network, accounts) => {
  let rootImplementation, dispatcherStorage, dispatcher;
  await deployer.deploy(RootImplementation).then(instance => {
    rootImplementation = instance;
  });
  await deployer.deploy(DispatcherStorage, [accounts[0]]).then(instance => {
    dispatcherStorage = instance;
    dispatcherStorage.upgrade(rootImplementation.address, { from: accounts[0] });
    Dispatcher.unlinked_binary = Dispatcher.unlinked_binary
      .replace('1111222233334444555566667777888899990000',
        dispatcherStorage.address.slice(2));
  });
  await deployer.deploy(Dispatcher).then(instance => {
    dispatcher = instance;
    Root.link('RootInterface', dispatcher.address);
  });
  await deployer.deploy(Root, 2, 5, [accounts[0]]);
};
