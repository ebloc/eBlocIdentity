/* global artifacts contract before describe it web3 assert */

const truffleAssert = require('truffle-assertions');

const Group = artifacts.require('Group');
const Root = artifacts.require('Root');

contract('Group', accounts => {
  let group;
  before(async () => {
    const root = await Root.deployed();
    await truffleAssert.passes(root.addMember(web3.utils.fromAscii('Member'), accounts[2], { from: accounts[0] }));
    const x = await root.addSubgroup(web3.utils.fromAscii('bogazici'), [accounts[2]], { from: accounts[0] });
    let subgroup;
    truffleAssert.eventEmitted(x, 'GroupCreated', event => {
      subgroup = event.addr;
      return !!event.addr;
    });
    await truffleAssert.passes(root.addMember(web3.utils.fromAscii('Member'), accounts[3], { from: accounts[0] }));
    group = await Group.at(subgroup);
  });
  describe('addSubgroup', () => {
    it('should add subgroup', () => {
      truffleAssert.passes(group.addSubgroup(web3.utils.fromAscii('cmpe'), [accounts[3]], { from: accounts[2] }));
    });
    it('should revert when called by non-owner', () => {
      truffleAssert.reverts(group.addSubgroup(web3.utils.fromAscii('cmpe'), [accounts[3]], { from: accounts[1] }));
    });
  });
  describe('checkSubgroup', () => {
    it('should check added subgroup', async () => {
      const x = await group.checkSubgroup(web3.utils.fromAscii('cmpe'));
      assert.equal(x.valueOf(), true);
    });
    it('should check non-existing subgroup with wrong name', async () => {
      const x = await group.checkSubgroup(web3.utils.fromAscii('cmpe_'));
      assert.equal(x.valueOf(), false);
    });
  });
  describe('countSubgroups', () => {
    it('should count added subgroup', async () => {
      const x = await group.countSubgroups();
      assert.equal(x.valueOf(), 1);
    });
  });
  describe('getSubgroup', () => {
    it('should get added subgroup', () => {
      truffleAssert.passes(group.getSubgroup(0));
    });
    it('should revert with non-existing subgroup', () => {
      truffleAssert.reverts(group.getSubgroup(1));
    });
  });
  describe('removeSubgroup', () => {
    it('should remove subgroup', () => {
      truffleAssert.passes(group.removeSubgroup(web3.utils.fromAscii('cmpe'), { from: accounts[2] }));
    });
    it('should revert when called by non-owner', () => {
      truffleAssert.reverts(group.removeSubgroup(web3.utils.fromAscii('cmpe'), { from: accounts[1] }));
    });
    it('should revert when non-existing subgroup is removed', () => {
      truffleAssert.reverts(group.removeSubgroup(web3.utils.fromAscii('cmpe'), { from: accounts[2] }));
    });
  });
  describe('checkSubgroup', () => {
    it('should check removed subgroup', async () => {
      const x = await group.checkSubgroup(web3.utils.fromAscii('cmpe'));
      assert.equal(x.valueOf(), false);
    });
  });
  describe('countSubgroups', () => {
    it('should count removed subgroup', async () => {
      const x = await group.countSubgroups();
      assert.equal(x.valueOf(), 0);
    });
  });
  describe('getSubgroup', () => {
    it('should revert with removed subgroup', () => {
      truffleAssert.reverts(group.getSubgroup(0));
    });
  });
  describe('addSubgroupRequest', () => {
    it('should add subgroup request', () => {
      truffleAssert.passes(group.addSubgroupRequest(web3.utils.fromAscii('ee'), { from: accounts[3] }));
    });
    it('should revert when existing subgroup request is added', () => {
      truffleAssert.reverts(group.addSubgroupRequest(web3.utils.fromAscii('ee'), { from: accounts[3] }));
    });
  });
  describe('checkSubgroupRequest', () => {
    it('should check added subgroup request', async () => {
      const x = await group.checkSubgroupRequest(web3.utils.fromAscii('ee'), accounts[3]);
      assert.equal(x.valueOf(), true);
    });
    it('should check non-existing subgroup request with wrong name', async () => {
      const x = await group.checkSubgroupRequest(web3.utils.fromAscii('ee_'), accounts[3]);
      assert.equal(x.valueOf(), false);
    });
    it('should check non-existing subgroup request with wrong owner', async () => {
      const x = await group.checkSubgroupRequest(web3.utils.fromAscii('ee'), accounts[1]);
      assert.equal(x.valueOf(), false);
    });
  });
  describe('countSubgroupRequests', () => {
    it('should count added subgroup request', async () => {
      const x = await group.countSubgroupRequests({ from: accounts[2] });
      assert.equal(x.valueOf(), 1);
    });
    it('should revert when called by non-owner', () => {
      truffleAssert.reverts(group.countSubgroupRequests({ from: accounts[1] }));
    });
  });
  describe('getSubgroupRequest', () => {
    it('should get added subgroup request', async () => {
      const x = await group.getSubgroupRequest(0, { from: accounts[2] });
      assert.equal(web3.utils.toAscii(x[0]).replace(/\0/g, ''), 'ee');
      assert.equal(x[1].valueOf(), accounts[3]);
    });
    it('should revert when called by non-owner', () => {
      truffleAssert.reverts(group.getSubgroupRequest(0, { from: accounts[1] }));
    });
    it('should revert with non-existing subgroup request', () => {
      truffleAssert.reverts(group.getSubgroupRequest(1, { from: accounts[2] }));
    });
  });
  describe('removeSubgroupRequest', () => {
    it('should remove subgroup request', () => {
      truffleAssert.passes(group.removeSubgroupRequest(web3.utils.fromAscii('ee'), accounts[3], { from: accounts[2] }));
    });
    it('should revert when called by non-owner', () => {
      truffleAssert.reverts(group.removeSubgroupRequest(web3.utils.fromAscii('ee'), accounts[3], { from: accounts[1] }));
    });
    it('should revert when non-existing subgroup request is removed', () => {
      truffleAssert.reverts(group.removeSubgroupRequest(web3.utils.fromAscii('ee'), accounts[3], { from: accounts[2] }));
    });
  });
  describe('checkSubgroupRequest', () => {
    it('should check removed subgroup request', async () => {
      const x = await group.checkSubgroupRequest(web3.utils.fromAscii('ee'), accounts[3]);
      assert.equal(x.valueOf(), false);
    });
  });
  describe('countSubgroupRequests', () => {
    it('should count removed subgroup request', async () => {
      const x = await group.countSubgroupRequests({ from: accounts[2] });
      assert.equal(x.valueOf(), 0);
    });
  });
  describe('getSubgroupRequest', () => {
    it('should revert with removed subgroup request', () => {
      truffleAssert.reverts(group.getSubgroupRequest(0, { from: accounts[2] }));
    });
  });
  describe('addOwner', () => {
    it('should add owner', () => {
      truffleAssert.passes(group.addOwner(accounts[3], { from: accounts[2] }));
    });
    it('should revert when called by non-owner', () => {
      truffleAssert.reverts(group.addOwner(accounts[3], { from: accounts[1] }));
    });
    it('should revert when existing owner is added', () => {
      truffleAssert.reverts(group.addOwner(accounts[3], { from: accounts[2] }));
    });
  });
  describe('checkOwner', () => {
    it('should check added owner', async () => {
      const x = await group.checkOwner(accounts[3]);
      assert.equal(x.valueOf(), true);
    });
    it('should check non-existing owner with wrong address', async () => {
      const x = await group.checkOwner(accounts[1]);
      assert.equal(x.valueOf(), false);
    });
  });
  describe('countOwners', () => {
    it('should count added owner', async () => {
      const x = await group.countOwners({ from: accounts[2] });
      assert.equal(x.valueOf(), 2);
    });
    it('should revert when called by non-owner', () => {
      truffleAssert.reverts(group.countOwners({ from: accounts[1] }));
    });
  });
  describe('getOwner', () => {
    it('should get added owner', async () => {
      const x = await group.getOwner(1, { from: accounts[2] });
      assert.equal(x.valueOf(), accounts[3]);
    });
    it('should revert when called by non-owner', () => {
      truffleAssert.reverts(group.getOwner(1, { from: accounts[1] }));
    });
    it('should revert with non-existing owner', () => {
      truffleAssert.reverts(group.getOwner(2, { from: accounts[2] }));
    });
  });
  describe('checkOwnerRemovalVote', () => {
    it('should check vote', async () => {
      const x = await group.checkOwnerRemovalVote(accounts[3], { from: accounts[2] });
      assert.equal(x.valueOf(), false);
    });
    it('should revert when called by non-owner', () => {
      truffleAssert.reverts(group.checkOwnerRemovalVote(accounts[3], { from: accounts[1] }));
    });
  });
  describe('voteToRemoveOwner', () => {
    it('should remove voted owner', () => {
      truffleAssert.passes(group.voteToRemoveOwner(accounts[3], { from: accounts[2] }));
    });
    it('should revert when called by non-owner', () => {
      truffleAssert.reverts(group.voteToRemoveOwner(accounts[3], { from: accounts[1] }));
    });
    it('should revert when non-existing owner is removed', () => {
      truffleAssert.reverts(group.voteToRemoveOwner(accounts[3], { from: accounts[2] }));
    });
  });
  describe('checkOwner', () => {
    it('should check removed owner', async () => {
      const x = await group.checkOwner(accounts[3]);
      assert.equal(x.valueOf(), false);
    });
  });
  describe('countOwners', () => {
    it('should count removed owner', async () => {
      const x = await group.countOwners({ from: accounts[2] });
      assert.equal(x.valueOf(), 1);
    });
  });
  describe('getOwner', () => {
    it('should revert with removed owner', () => {
      truffleAssert.reverts(group.getOwner(1, { from: accounts[2] }));
    });
  });
  describe('checkOwnerRemovalVote', () => {
    it('should check vote', async () => {
      const x = await group.checkOwnerRemovalVote(accounts[3], { from: accounts[2] });
      assert.equal(x.valueOf(), true);
    });
  });
  describe('addMember', () => {
    it('should add member', () => {
      truffleAssert.passes(group.addMember(web3.utils.fromAscii('member'), accounts[3], { from: accounts[2] }));
    });
    it('should revert when called by non-owner', () => {
      truffleAssert.reverts(group.addMember(web3.utils.fromAscii('member'), accounts[3], { from: accounts[1] }));
    });
    it('should revert when existing member is added', () => {
      truffleAssert.reverts(group.addMember(web3.utils.fromAscii('member'), accounts[3], { from: accounts[2] }));
    });
  });
  describe('checkMember', () => {
    it('should check added member', async () => {
      const x = await group.checkMember(web3.utils.fromAscii('member'), accounts[3]);
      assert.equal(x.valueOf(), true);
    });
    it('should check non-existing member with wrong role', async () => {
      const x = await group.checkMember(web3.utils.fromAscii('member_'), accounts[3]);
      assert.equal(x.valueOf(), false);
    });
    it('should check non-existing member with wrong address', async () => {
      const x = await group.checkMember(web3.utils.fromAscii('member'), accounts[1]);
      assert.equal(x.valueOf(), false);
    });
  });
  describe('countMembers', () => {
    it('should count added member', async () => {
      const x = await group.countMembers();
      assert.equal(x.valueOf(), 1);
    });
  });
  describe('getMember', () => {
    it('should get added member', async () => {
      const x = await group.getMember(0);
      assert.equal(web3.utils.toAscii(x[0]).replace(/\0/g, ''), 'member');
      assert.equal(x[1].valueOf(), accounts[3]);
    });
    it('should revert with non-existing member', () => {
      truffleAssert.reverts(group.getMember(1));
    });
  });
  describe('removeMember', () => {
    it('should remove member', () => {
      truffleAssert.passes(group.removeMember(web3.utils.fromAscii('member'), accounts[3], { from: accounts[2] }));
    });
    it('should revert when called by non-owner', () => {
      truffleAssert.reverts(group.removeMember(web3.utils.fromAscii('member'), accounts[3], { from: accounts[1] }));
    });
    it('should revert when non-existing member is removed', () => {
      truffleAssert.reverts(group.removeMember(web3.utils.fromAscii('member'), accounts[3], { from: accounts[2] }));
    });
  });
  describe('checkMember', () => {
    it('should check removed member', async () => {
      const x = await group.checkMember(web3.utils.fromAscii('member'), accounts[3]);
      assert.equal(x.valueOf(), false);
    });
  });
  describe('countMembers', () => {
    it('should count removed member', async () => {
      const x = await group.countMembers();
      assert.equal(x.valueOf(), 0);
    });
  });
  describe('getMember', () => {
    it('should revert with removed member', () => {
      truffleAssert.reverts(group.getMember(0));
    });
  });
  describe('addMemberRequest', () => {
    it('should add member request', () => {
      truffleAssert.passes(group.addMemberRequest(web3.utils.fromAscii('member'), { from: accounts[3] }));
    });
    it('should revert when existing member request is added', () => {
      truffleAssert.reverts(group.addMemberRequest(web3.utils.fromAscii('member'), { from: accounts[3] }));
    });
  });
  describe('checkMemberRequest', () => {
    it('should check added member request', async () => {
      const x = await group.checkMemberRequest(web3.utils.fromAscii('member'), accounts[3]);
      assert.equal(x.valueOf(), true);
    });
    it('should check non-existing member request with wrong role', async () => {
      const x = await group.checkMemberRequest(web3.utils.fromAscii('member_'), accounts[3]);
      assert.equal(x.valueOf(), false);
    });
    it('should check non-existing member request with wrong address', async () => {
      const x = await group.checkMemberRequest(web3.utils.fromAscii('member'), accounts[1]);
      assert.equal(x.valueOf(), false);
    });
  });
  describe('countMemberRequests', () => {
    it('should count added member request', async () => {
      const x = await group.countMemberRequests({ from: accounts[2] });
      assert.equal(x.valueOf(), 1);
    });
    it('should revert when called by non-owner', () => {
      truffleAssert.reverts(group.countMemberRequests({ from: accounts[1] }));
    });
  });
  describe('getMemberRequest', () => {
    it('should get added member request', async () => {
      const x = await group.getMemberRequest(0, { from: accounts[2] });
      assert.equal(web3.utils.toAscii(x[0]).replace(/\0/g, ''), 'member');
      assert.equal(x[1].valueOf(), accounts[3]);
    });
    it('should revert when called by non-owner', () => {
      truffleAssert.reverts(group.getMemberRequest(0, { from: accounts[1] }));
    });
    it('should revert with non-existing member request', () => {
      truffleAssert.reverts(group.getMemberRequest(1, { from: accounts[2] }));
    });
  });
  describe('removeMemberRequest', () => {
    it('should remove member request', () => {
      truffleAssert.passes(group.removeMemberRequest(web3.utils.fromAscii('member'), accounts[3], { from: accounts[2] }));
    });
    it('should revert when called by non-owner', () => {
      truffleAssert.reverts(group.removeMemberRequest(web3.utils.fromAscii('member'), accounts[3], { from: accounts[1] }));
    });
    it('should revert when non-existing member request is removed', () => {
      truffleAssert.reverts(group.removeMemberRequest(web3.utils.fromAscii('member'), accounts[3], { from: accounts[2] }));
    });
  });
  describe('checkMemberRequest', () => {
    it('should check removed member request', async () => {
      const x = await group.checkMemberRequest(web3.utils.fromAscii('member'), accounts[3]);
      assert.equal(x.valueOf(), false);
    });
  });
  describe('countMemberRequests', () => {
    it('should count removed member request', async () => {
      const x = await group.countMemberRequests({ from: accounts[2] });
      assert.equal(x.valueOf(), 0);
    });
  });
  describe('getMemberRequest', () => {
    it('should revert with removed member request', () => {
      truffleAssert.reverts(group.getMemberRequest(0, { from: accounts[2] }));
    });
  });
});
