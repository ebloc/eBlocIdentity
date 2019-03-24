/* global contractInstance, Web3 */

let userAddress;

window.addEventListener('load', async () => {
  if (window.ethereum) {
    window.web3 = new Web3(window.ethereum);
    try {
      await window.ethereum.enable();
    } catch (error) {
      window.alert('Unable to get account address!');
    }
  } else if (window.web3) {
    window.web3 = new Web3(window.web3.currentProvider);
  }
  if (window.web3) {
    window.setTimeout(() => {
      userAddress = window.web3.eth.accounts[0];
    }, 500);
  }
});

window.checkForm = (address) => {
  address = document.getElementById(address);
  return !(!address.validity.valid || (window.web3 && !window.web3.isAddress(address.value)));
};

window.checkAddress = (address, help) => {
  address = document.getElementById(address);
  help = document.getElementById(help);
  if (!address.validity.valid) {
    address.classList.add('invalid');
    help.innerHTML = 'Ethereum address is required.';
  } else if (window.web3 && !window.web3.isAddress(address.value)) {
    address.classList.add('invalid');
    help.innerHTML = 'Ethereum address is not valid.';
  } else {
    address.classList.remove('invalid');
    help.innerHTML = '';
  }
};

const addSubgroup = (name = document.getElementById('addSubgroupName').value, owners = document.getElementById('addSubgroupOwners').value.split(',')) => {
  contractInstance.addSubgroup.sendTransaction(window.web3.fromAscii(name), owners, { from: userAddress }, (err, transactionHash) => {
    if (err) { console.error(err); }
    console.log(transactionHash);
  });
};

window.checkSubgroup = () => {
  document.getElementById('checkSubgroup').innerHTML = '';
  contractInstance.checkSubgroup.sendTransaction(window.web3.fromAscii(document.getElementById('checkSubgroupName').value), { from: userAddress }, (err, result) => {
    if (err) { console.error(err); }
    document.getElementById('checkSubgroup').innerHTML = `${result ? 'Subgroup' : 'Not a subgroup'}`;
  });
};

window.removeSubgroup = (name) => {
  contractInstance.removeSubgroup.sendTransaction(window.web3.fromAscii(name), { from: userAddress }, (err, transactionHash) => {
    if (err) { console.error(err); }
    console.log(transactionHash);
  });
};

window.addSubgroupRequest = () => {
  contractInstance.addSubgroupRequest.sendTransaction(window.web3.fromAscii(document.getElementById('addSubgroupRequestName').value), { from: userAddress }, (err, transactionHash) => {
    if (err) { console.error(err); }
    console.log(transactionHash);
  });
};

window.checkSubgroupRequest = () => {
  document.getElementById('checkSubgroupRequest').innerHTML = '';
  contractInstance.checkSubgroupRequest.call(window.web3.fromAscii(document.getElementById('checkSubgroupRequestName').value), document.getElementById('checkSubgroupRequestOwner').value, { from: userAddress }, (err, result) => {
    if (err) { console.error(err); }
    document.getElementById('checkSubgroupRequest').innerHTML = `${result ? 'Subgroup' : 'Not a subgroup'} request`;
  });
};

const removeSubgroupRequest = (name, owner) => {
  contractInstance.removeSubgroupRequest.sendTransaction(window.web3.fromAscii(name), owner, { from: userAddress }, (err, transactionHash) => {
    if (err) { console.error(err); }
    console.log(transactionHash);
  });
};

window.acceptSubgroupRequest = (name, owner) => {
  removeSubgroupRequest(name, owner);
  addSubgroup(name, [owner]);
};

window.addOwner = () => {
  contractInstance.addOwner.sendTransaction(document.getElementById('addOwnerAddress').value, { from: userAddress }, (err, transactionHash) => {
    if (err) { console.error(err); }
    console.log(transactionHash);
  });
};

window.checkOwner = () => {
  document.getElementById('checkOwner').innerHTML = '';
  contractInstance.checkOwner.call(document.getElementById('checkOwnerAddress').value, { from: userAddress }, (err, result) => {
    if (err) { console.error(err); }
    document.getElementById('checkOwner').innerHTML = `${result ? 'Owner' : 'Not an owner'}`;
  });
};

window.voteToRemoveOwner = (address) => {
  contractInstance.voteToRemoveOwner.sendTransaction(address, { from: userAddress }, (err, transactionHash) => {
    if (err) { console.error(err); }
    console.log(transactionHash);
  });
};

window.withdrawVoteToRemoveOwner = (address) => {
  contractInstance.withdrawVoteToRemoveOwner.sendTransaction(address, { from: userAddress }, (err, transactionHash) => {
    if (err) { console.error(err); }
    console.log(transactionHash);
  });
};

const addMember = (role = document.getElementById('addMemberRole').value, address = document.getElementById('addMemberAddress').value) => {
  contractInstance.addMember.sendTransaction(window.web3.fromAscii(role), address, { from: userAddress }, (err, transactionHash) => {
    if (err) { console.error(err); }
    console.log(transactionHash);
  });
};

window.checkMember = () => {
  document.getElementById('checkMember').innerHTML = '';
  contractInstance.checkMember.call(window.web3.fromAscii(document.getElementById('checkMemberRole').value), document.getElementById('checkMemberAddress').value, { from: userAddress }, (err, result) => {
    if (err) { console.error(err); }
    document.getElementById('checkMember').innerHTML = `${result ? 'Member' : 'Not a member'}`;
  });
};

window.removeMember = (role, address) => {
  contractInstance.removeMember.sendTransaction(window.web3.fromAscii(role), address, { from: userAddress }, (err, transactionHash) => {
    if (err) { console.error(err); }
    console.log(transactionHash);
  });
};

window.addMemberRequest = () => {
  contractInstance.addMemberRequest.sendTransaction(window.web3.fromAscii(document.getElementById('addMemberRequestRole').value), { from: userAddress }, (err, transactionHash) => {
    if (err) { console.error(err); }
    console.log(transactionHash);
  });
};

window.checkMemberRequest = () => {
  document.getElementById('checkMemberRequest').innerHTML = '';
  contractInstance.checkMemberRequest.call(window.web3.fromAscii(document.getElementById('checkMemberRequestRole').value), document.getElementById('checkMemberRequestAddress').value, { from: userAddress }, (err, result) => {
    if (err) { console.error(err); }
    document.getElementById('checkMemberRequest').innerHTML = `${result ? 'Member' : 'Not a member'} request`;
  });
};

const removeMemberRequest = (role, address) => {
  contractInstance.removeMemberRequest.sendTransaction(window.web3.fromAscii(role), address, { from: userAddress }, (err, transactionHash) => {
    if (err) { console.error(err); }
    console.log(transactionHash);
  });
};

window.acceptMemberRequest = (role, address) => {
  removeMemberRequest(role, address);
  addMember(role, address);
};
