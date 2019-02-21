/* global Web3 */

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
      document.getElementById('address').value = window.web3.eth.accounts[0];
    }, 500);
  }
});

window.checkForm = () => {
  const address = document.getElementById('address');
  const email = document.getElementById('email');
  return !(!address.validity.valid || (window.web3 && !window.web3.isAddress(address.value)) || !email.validity.valid);
};

window.checkAddress = () => {
  const address = document.getElementById('address');
  const help = document.getElementById('addressHelp');
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

window.checkEmail = () => {
  const email = document.getElementById('email');
  const help = document.getElementById('emailHelp');
  if (!email.validity.valid) {
    email.classList.add('invalid');
    if (email.validity.valueMissing) {
      help.innerHTML = 'Email is required.';
    } else if (email.validity.typeMismatch) {
      help.innerHTML = 'Email is not valid.';
    } else if (email.validity.patternMismatch) {
      help.innerHTML = 'Email is not academic.';
    }
  } else {
    email.classList.remove('invalid');
    help.innerHTML = '';
  }
};
