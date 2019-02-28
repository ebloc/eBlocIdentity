module.exports = {
  networks: {
    development: {
      host: 'ganache',
      port: 8545,
      network_id: '*' // Match any network id
    }
  },
  compilers: {
    solc: {
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  }
};
