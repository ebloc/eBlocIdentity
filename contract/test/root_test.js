/* global artifacts contract before describe it web3 assert */

const truffleAssert = require('truffle-assertions');

const Group = artifacts.require('Group');
const Root = artifacts.require('Root');

contract('Root', accounts => {
  let root, subgroup;
  before(async () => {
    root = await Root.deployed();
  });
  describe('createGroup', () => {
    it('should catch event and verify parent and name', async () => {
      await truffleAssert.passes(root.addMember(web3.utils.fromAscii('Member'), accounts[2], { from: accounts[0] }));
      const x = await root.createGroup(root.address, web3.utils.fromAscii('bogazici'), [accounts[2]], { from: accounts[0] });
      let addr;
      truffleAssert.eventEmitted(x, 'GroupCreated', event => {
        addr = event.addr;
        return !!event.addr;
      });
      const group = await Group.at(addr);
      const y = await group.getParent();
      assert.equal(y, root.address);
      const z = await group.getName();
      assert.equal(web3.utils.toAscii(z).replace(/\0/g, ''), 'bogazici');
    });
  });
  describe('addSubgroup', () => {
    it('should catch event and print group address', async () => {
      const x = await root.addSubgroup(web3.utils.fromAscii('bogazici'), [accounts[2]], { from: accounts[0] });
      truffleAssert.eventEmitted(x, 'GroupCreated', event => {
        subgroup = event.addr;
        console.log(event.addr);
        return !!event.addr;
      });
      truffleAssert.passes(root.removeMember(web3.utils.fromAscii('Member'), accounts[2], { from: accounts[0] }));
    });
    it('should revert when called by non-owner', () => {
      truffleAssert.reverts(root.addSubgroup(web3.utils.fromAscii('bogazici'), [accounts[2]], { from: accounts[1] }));
    });
  });
  describe('checkSubgroup', () => {
    it('should check added subgroup', async () => {
      const x = await root.checkSubgroup(web3.utils.fromAscii('bogazici'));
      assert.equal(x.valueOf(), true);
    });
    it('should check non-existing subgroup with wrong name', async () => {
      const x = await root.checkSubgroup(web3.utils.fromAscii('bogazici_'));
      assert.equal(x.valueOf(), false);
    });
  });
  describe('countSubgroups', () => {
    it('should count added subgroup', async () => {
      const x = await root.countSubgroups();
      assert.equal(x.valueOf(), 1);
    });
  });
  describe('getSubgroup', () => {
    it('should get added subgroup', async () => {
      const x = await root.getSubgroup(0);
      assert.equal(x, subgroup);
    });
    it('should revert with non-existing subgroup', () => {
      truffleAssert.reverts(root.getSubgroup(1));
    });
  });
  describe('removeSubgroup', () => {
    it('should remove subgroup', () => {
      truffleAssert.passes(root.removeSubgroup(web3.utils.fromAscii('bogazici'), { from: accounts[0] }));
    });
    it('should revert when called by non-owner', () => {
      truffleAssert.reverts(root.removeSubgroup(web3.utils.fromAscii('bogazici'), { from: accounts[1] }));
    });
    it('should revert when non-existing subgroup is removed', () => {
      truffleAssert.reverts(root.removeSubgroup(web3.utils.fromAscii('bogazici'), { from: accounts[0] }));
    });
  });
  describe('checkSubgroup', () => {
    it('should check removed subgroup', async () => {
      const x = await root.checkSubgroup(web3.utils.fromAscii('bogazici'));
      assert.equal(x.valueOf(), false);
    });
  });
  describe('countSubgroups', () => {
    it('should count removed subgroup', async () => {
      const x = await root.countSubgroups();
      assert.equal(x.valueOf(), 0);
    });
  });
  describe('getSubgroup', () => {
    it('should revert with removed subgroup', () => {
      truffleAssert.reverts(root.getSubgroup(0));
    });
  });
  describe('addOwner', () => {
    it('should add owner', () => {
      truffleAssert.passes(root.addOwner(accounts[2], { from: accounts[0] }));
    });
    it('should revert when called by non-owner', () => {
      truffleAssert.reverts(root.addOwner(accounts[2], { from: accounts[1] }));
    });
    it('should revert when existing owner is added', () => {
      truffleAssert.reverts(root.addOwner(accounts[2], { from: accounts[0] }));
    });
  });
  describe('checkOwner', () => {
    it('should check added owner', async () => {
      const x = await root.checkOwner(accounts[2]);
      assert.equal(x.valueOf(), true);
    });
    it('should check non-existing owner with wrong address', async () => {
      const x = await root.checkOwner(accounts[1]);
      assert.equal(x.valueOf(), false);
    });
  });
  describe('countOwners', () => {
    it('should count added owner', async () => {
      const x = await root.countOwners({ from: accounts[0] });
      assert.equal(x.valueOf(), 2);
    });
    it('should revert when called by non-owner', () => {
      truffleAssert.reverts(root.countOwners({ from: accounts[1] }));
    });
  });
  describe('getOwner', () => {
    it('should get added owner', async () => {
      const x = await root.getOwner(1, { from: accounts[0] });
      assert.equal(x.valueOf(), accounts[2]);
    });
    it('should revert when called by non-owner', () => {
      truffleAssert.reverts(root.getOwner(1, { from: accounts[1] }));
    });
    it('should revert with non-existing owner', () => {
      truffleAssert.reverts(root.getOwner(2, { from: accounts[0] }));
    });
  });
  describe('checkOwnerRemovalVote', () => {
    it('should check vote', async () => {
      const x = await root.checkOwnerRemovalVote(accounts[2], { from: accounts[0] });
      assert.equal(x.valueOf(), false);
    });
    it('should revert when called by non-owner', () => {
      truffleAssert.reverts(root.checkOwnerRemovalVote(accounts[2], { from: accounts[1] }));
    });
  });
  describe('voteToRemoveOwner', () => {
    it('should remove voted owner', () => {
      truffleAssert.passes(root.voteToRemoveOwner(accounts[2], { from: accounts[0] }));
    });
    it('should revert when called by non-owner', () => {
      truffleAssert.reverts(root.voteToRemoveOwner(accounts[2], { from: accounts[1] }));
    });
    it('should revert when non-existing owner is removed', () => {
      truffleAssert.reverts(root.voteToRemoveOwner(accounts[2], { from: accounts[0] }));
    });
  });
  describe('checkOwner', () => {
    it('should check removed owner', async () => {
      const x = await root.checkOwner(accounts[2]);
      assert.equal(x.valueOf(), false);
    });
  });
  describe('countOwners', () => {
    it('should count removed owner', async () => {
      const x = await root.countOwners({ from: accounts[0] });
      assert.equal(x.valueOf(), 1);
    });
  });
  describe('getOwner', () => {
    it('should revert with removed owner', () => {
      truffleAssert.reverts(root.getOwner(1, { from: accounts[0] }));
    });
  });
  describe('checkOwnerRemovalVote', () => {
    it('should check vote', async () => {
      const x = await root.checkOwnerRemovalVote(accounts[2], { from: accounts[0] });
      assert.equal(x.valueOf(), true);
    });
  });
  describe('addMember', () => {
    it('should add member', () => {
      truffleAssert.passes(root.addMember(web3.utils.fromAscii('member'), accounts[2], { from: accounts[0] }));
    });
    it('should revert when called by non-owner', () => {
      truffleAssert.reverts(root.addMember(web3.utils.fromAscii('member'), accounts[2], { from: accounts[1] }));
    });
    it('should revert when existing member is added', () => {
      truffleAssert.reverts(root.addMember(web3.utils.fromAscii('member'), accounts[2], { from: accounts[0] }));
    });
  });
  describe('checkMember', () => {
    it('should check added member', async () => {
      const x = await root.checkMember(web3.utils.fromAscii('member'), accounts[2]);
      assert.equal(x.valueOf(), true);
    });
    it('should check non-existing member with wrong role', async () => {
      const x = await root.checkMember(web3.utils.fromAscii('member_'), accounts[2]);
      assert.equal(x.valueOf(), false);
    });
    it('should check non-existing member with wrong address', async () => {
      const x = await root.checkMember(web3.utils.fromAscii('member'), accounts[1]);
      assert.equal(x.valueOf(), false);
    });
  });
  describe('countMembers', () => {
    it('should count added member', async () => {
      const x = await root.countMembers();
      assert.equal(x.valueOf(), 1);
    });
  });
  describe('getMember', () => {
    it('should get added member', async () => {
      const x = await root.getMember(0);
      assert.equal(web3.utils.toAscii(x[0]).replace(/\0/g, ''), 'member');
      assert.equal(x[1].valueOf(), accounts[2]);
    });
    it('should revert with non-existing member', () => {
      truffleAssert.reverts(root.getMember(1));
    });
  });
  describe('removeMember', () => {
    it('should remove member', () => {
      truffleAssert.passes(root.removeMember(web3.utils.fromAscii('member'), accounts[2], { from: accounts[0] }));
    });
    it('should revert when called by non-owner', () => {
      truffleAssert.reverts(root.removeMember(web3.utils.fromAscii('member'), accounts[2], { from: accounts[1] }));
    });
    it('should revert when non-existing member is removed', () => {
      truffleAssert.reverts(root.removeMember(web3.utils.fromAscii('member'), accounts[2], { from: accounts[0] }));
    });
  });
  describe('checkMember', () => {
    it('should check removed member', async () => {
      const x = await root.checkMember(web3.utils.fromAscii('member'), accounts[2]);
      assert.equal(x.valueOf(), false);
    });
  });
  describe('countMembers', () => {
    it('should count removed member', async () => {
      const x = await root.countMembers();
      assert.equal(x.valueOf(), 0);
    });
  });
  describe('getMember', () => {
    it('should revert with removed member', () => {
      truffleAssert.reverts(root.getMember(0));
    });
  });
});
