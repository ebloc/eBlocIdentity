pragma solidity ^0.5.0;

contract Group {

    struct OwnerRemovalVoter {
        mapping(address => bool) voters;
    }

    struct User {
        bytes32 role;
        address addr;
    }

    Root private root;
    Group private parent;
    bytes32 private name;
    uint256 private ownerRemovalLimitNumerator;
    uint256 private ownerRemovalLimitDenominator;
    Group[] private subgroups;
    mapping(bytes32 => uint256) private subgroupIndexes;
    User[] private subgroupRequests;
    mapping(bytes32 => mapping(address => uint256)) private subgroupRequestIndexes;
    address[] private owners;
    mapping(address => uint256) private ownerIndexes;
    mapping(address => OwnerRemovalVoter) private ownerRemovalVoters;
    mapping(address => uint256) private ownerRemovalVoteCounts;
    User[] private members;
    mapping(bytes32 => mapping(address => uint256)) private memberIndexes;
    User[] private memberRequests;
    mapping(bytes32 => mapping(address => uint256)) private memberRequestIndexes;

    constructor(address _root, address _parent, bytes32 _name, uint256 _ownerRemovalLimitNumerator, uint256 _ownerRemovalLimitDenominator, address[] memory _owners) public {
        root = Root(_root);
        parent = Group(_parent);
        name = _name;
        ownerRemovalLimitNumerator = _ownerRemovalLimitNumerator;
        ownerRemovalLimitDenominator = _ownerRemovalLimitDenominator;
        for (uint i = 0; i < _owners.length; i++) {
            address addr = _owners[i];
            ownerIndexes[addr] = owners.push(addr);
        }
    }

    modifier onlyOwners() {
        require(checkOwner(msg.sender), "Caller is not owner.");
        _;
    }

    function getParent() public view returns(Group) {
        return parent;
    }

    function getName() public view returns(bytes32) {
        return name;
    }

    function addSubgroup(bytes32 _name, address[] memory _owners) public onlyOwners {
        require(!checkSubgroup(_name), "This subgroup already exists.");
        subgroupIndexes[_name] = subgroups.push(root.createGroup(address(this), _name, _owners));
    }

    function checkSubgroup(bytes32 _name) public view returns(bool) {
        return subgroupIndexes[_name] > 0 && subgroups[subgroupIndexes[_name] - 1].getName() == _name;
    }

    function countSubgroups() public view returns(uint256) {
        return subgroups.length;
    }

    function getSubgroup(uint256 index) public view returns(Group) {
        require(index < subgroups.length, "This subgroup does not exist.");
        return subgroups[index];
    }

    function removeSubgroup(bytes32 _name) public onlyOwners {
        require(checkSubgroup(_name), "This subgroup does not exist.");
        subgroups[subgroupIndexes[_name] - 1] = subgroups[subgroups.length - 1];
        delete subgroupIndexes[_name];
        delete subgroups[subgroups.length - 1];
        subgroups.length--;
    }

    function addSubgroupRequest(bytes32 _name) public {
        require(root.checkMember("Member", msg.sender), "This member does not belong to root.");
        require(!checkSubgroupRequest(_name, msg.sender), "This subgroup request already exists.");
        require(!checkSubgroup(_name), "This subgroup already exists.");
        subgroupRequestIndexes[_name][msg.sender] = subgroupRequests.push(User(_name, msg.sender));
    }

    function checkSubgroupRequest(bytes32 _name, address owner) public view returns(bool) {
        return subgroupRequestIndexes[_name][owner] > 0 && subgroupRequests[subgroupRequestIndexes[_name][owner] - 1].addr == owner;
    }

    function countSubgroupRequests() public view onlyOwners returns(uint256) {
        return subgroupRequests.length;
    }

    function getSubgroupRequest(uint256 index) public view onlyOwners returns(bytes32, address) {
        require(index < subgroupRequests.length, "This subgroup request does not exist.");
        return (subgroupRequests[index].role, subgroupRequests[index].addr);
    }

    function removeSubgroupRequest(bytes32 _name, address owner) public onlyOwners {
        require(checkSubgroupRequest(_name, owner), "This subgroup request does not exist.");
        subgroupRequests[subgroupRequestIndexes[_name][owner] - 1] = subgroupRequests[subgroupRequests.length - 1];
        delete subgroupRequestIndexes[_name][owner];
        delete subgroupRequests[subgroupRequests.length - 1];
        subgroupRequests.length--;
    }

    function addOwner(address addr) public onlyOwners {
        require(root.checkMember("Member", addr), "This member does not belong to root.");
        require(!checkOwner(addr), "This owner already exists.");
        ownerIndexes[addr] = owners.push(addr);
    }

    function checkOwner(address addr) public view returns(bool) {
        return ownerIndexes[addr] > 0 && owners[ownerIndexes[addr] - 1] == addr;
    }

    function countOwners() public view onlyOwners returns(uint256) {
        return owners.length;
    }

    function getOwner(uint256 index) public view onlyOwners returns(address) {
        require(index < owners.length, "This owner does not exist.");
        return owners[index];
    }

    function checkOwnerRemovalVote(address addr) public view onlyOwners returns(bool) {
        return ownerRemovalVoters[addr].voters[msg.sender];
    }

    function voteToRemoveOwner(address addr) public onlyOwners {
        require(checkOwner(addr), "This owner does not exist.");
        require(!checkOwnerRemovalVote(addr), "This vote already exists.");
        ownerRemovalVoters[addr].voters[msg.sender] = true;
        ownerRemovalVoteCounts[addr]++;
        if (owners.length * ownerRemovalLimitNumerator / ownerRemovalLimitDenominator <= ownerRemovalVoteCounts[addr]) {
            owners[ownerIndexes[addr] - 1] = owners[owners.length - 1];
            delete ownerIndexes[addr];
            delete owners[owners.length - 1];
            owners.length--;
            delete ownerRemovalVoters[addr];
            delete ownerRemovalVoteCounts[addr];
        }
    }

    function withdrawVoteToRemoveOwner(address addr) public onlyOwners {
        require(checkOwner(addr), "This owner does not exist.");
        require(checkOwnerRemovalVote(addr), "This vote does not exist.");
        delete ownerRemovalVoters[addr].voters[msg.sender];
        ownerRemovalVoteCounts[addr]--;
    }

    function addMember(bytes32 role, address addr) public onlyOwners {
        require(root.checkMember("Member", addr), "This member does not belong to root.");
        require(!checkMember(role, addr), "This member already exists.");
        require(!checkOwner(addr), "This owner already exists.");
        memberIndexes[role][addr] = members.push(User(role, addr));
    }

    function checkMember(bytes32 role, address addr) public view returns(bool) {
        return memberIndexes[role][addr] > 0 && members[memberIndexes[role][addr] - 1].addr == addr;
    }

    function countMembers() public view returns(uint256) {
        return members.length;
    }

    function getMember(uint256 index) public view returns(bytes32, address) {
        require(index < members.length, "This member does not exist.");
        return (members[index].role, members[index].addr);
    }

    function removeMember(bytes32 role, address addr) public onlyOwners {
        require(checkMember(role, addr), "This member does not exist.");
        members[memberIndexes[role][addr] - 1] = members[members.length - 1];
        delete memberIndexes[role][addr];
        delete members[members.length - 1];
        members.length--;
    }

    function addMemberRequest(bytes32 role) public {
        require(root.checkMember("Member", msg.sender), "This member does not belong to root.");
        require(!checkMemberRequest(role, msg.sender), "This member request already exists.");
        require(!checkMember(role, msg.sender), "This member already exists.");
        require(!checkOwner(msg.sender), "This owner already exists.");
        memberRequestIndexes[role][msg.sender] = memberRequests.push(User(role, msg.sender));
    }

    function checkMemberRequest(bytes32 role, address addr) public view returns(bool) {
        return memberRequestIndexes[role][addr] > 0 && memberRequests[memberRequestIndexes[role][addr] - 1].addr == addr;
    }

    function countMemberRequests() public view onlyOwners returns(uint256) {
        return memberRequests.length;
    }

    function getMemberRequest(uint256 index) public view onlyOwners returns(bytes32, address) {
        require(index < memberRequests.length, "This member request does not exist.");
        return (memberRequests[index].role, memberRequests[index].addr);
    }

    function removeMemberRequest(bytes32 role, address addr) public onlyOwners {
        require(checkMemberRequest(role, addr), "This member request does not exist.");
        memberRequests[memberRequestIndexes[role][addr] - 1] = memberRequests[memberRequests.length - 1];
        delete memberRequestIndexes[role][addr];
        delete memberRequests[memberRequests.length - 1];
        memberRequests.length--;
    }
}

contract DispatcherStorage {

    address public lib;
    mapping(address => bool) private owners;

    constructor(address[] memory _owners) public {
        for (uint i = 0; i < _owners.length; i++) {
            owners[_owners[i]] = true;
        }
    }

    modifier onlyOwners() {
        require(owners[msg.sender], "Caller is not owner.");
        _;
    }

    function upgrade(address newLib) public onlyOwners {
        lib = newLib;
    }
}

contract Dispatcher {

    function() external {
        DispatcherStorage dispatcherStorage = DispatcherStorage(0x1111222233334444555566667777888899990000);
        address target = dispatcherStorage.lib();

        assembly {
            calldatacopy(0x0, 0x0, calldatasize)
            let success := delegatecall(sub(gas, 10000), target, 0x0, calldatasize, 0, 0)
            let retSz := returndatasize
            returndatacopy(0, 0, retSz)
            switch success
            case 0 {
                revert(0, retSz)
            }
            default {
                return(0, retSz)
            }
        }
    }
}

library RootInterface {

    struct OwnerRemovalVoter {
        mapping(address => bool) voters;
    }

    struct User {
        bytes32 role;
        address addr;
    }

    struct Storage {
        uint256 ownerRemovalLimitNumerator;
        uint256 ownerRemovalLimitDenominator;
        Group[] subgroups;
        mapping(bytes32 => uint256) subgroupIndexes;
        address[] owners;
        mapping(address => uint256) ownerIndexes;
        mapping(address => OwnerRemovalVoter) ownerRemovalVoters;
        mapping(address => uint256) ownerRemovalVoteCounts;
        User[] members;
        mapping(bytes32 => mapping(address => uint256)) memberIndexes;
    }

    function createGroup(Storage storage s, address parent, bytes32 name, address[] memory owners) public returns(Group);
    function addSubgroup(Storage storage s, bytes32 name, address[] memory owners) public;
    function checkSubgroup(Storage storage s, bytes32 name) public view returns(bool);
    function countSubgroups(Storage storage s) public view returns(uint256);
    function getSubgroup(Storage storage s, uint256 index) public view returns(Group);
    function removeSubgroup(Storage storage s, bytes32 name) public;
    function addOwner(Storage storage s, address addr) public;
    function checkOwner(Storage storage s, address addr) public view returns(bool);
    function countOwners(Storage storage s) public view returns(uint256);
    function getOwner(Storage storage s, uint256 index) public view returns(address);
    function checkOwnerRemovalVote(Storage storage s, address addr) public view returns(bool);
    function voteToRemoveOwner(Storage storage s, address addr) public;
    function withdrawVoteToRemoveOwner(Storage storage s, address addr) public;
    function addMember(Storage storage s, bytes32 role, address addr) public;
    function checkMember(Storage storage s, bytes32 role, address addr) public view returns(bool);
    function countMembers(Storage storage s) public view returns(uint256);
    function getMember(Storage storage s, uint256 index) public view returns(bytes32, address);
    function removeMember(Storage storage s, bytes32 role, address addr) public;
}

contract Root {

    RootInterface.Storage s;

    using RootInterface for RootInterface.Storage;

    event GroupCreated(address addr);

    constructor(uint256 ownerRemovalLimitNumerator, uint256 ownerRemovalLimitDenominator, address[] memory owners) public {
        s.ownerRemovalLimitNumerator = ownerRemovalLimitNumerator;
        s.ownerRemovalLimitDenominator = ownerRemovalLimitDenominator;
        for (uint i = 0; i < owners.length; i++) {
            address addr = owners[i];
            s.ownerIndexes[addr] = s.owners.push(addr);
        }
    }

    modifier onlyOwners() {
        require(s.checkOwner(msg.sender), "Caller is not owner.");
        _;
    }

    function createGroup(address parent, bytes32 name, address[] memory owners) public returns(Group) {
        return s.createGroup(parent, name, owners);
    }

    function addSubgroup(bytes32 name, address[] memory owners) public onlyOwners {
        return s.addSubgroup(name, owners);
    }

    function checkSubgroup(bytes32 name) public view returns(bool) {
        return s.checkSubgroup(name);
    }

    function countSubgroups() public view returns(uint256) {
        return s.countSubgroups();
    }

    function getSubgroup(uint256 index) public view returns(Group) {
        return s.getSubgroup(index);
    }

    function removeSubgroup(bytes32 name) public onlyOwners {
        return s.removeSubgroup(name);
    }

    function addOwner(address addr) public onlyOwners {
        return s.addOwner(addr);
    }

    function checkOwner(address addr) public view returns(bool) {
        return s.checkOwner(addr);
    }

    function countOwners() public view onlyOwners returns(uint256) {
        return s.countOwners();
    }

    function getOwner(uint256 index) public view onlyOwners returns(address) {
        return s.getOwner(index);
    }

    function checkOwnerRemovalVote(address addr) public view onlyOwners returns(bool) {
        return s.checkOwnerRemovalVote(addr);
    }

    function voteToRemoveOwner(address addr) public onlyOwners {
        return s.voteToRemoveOwner(addr);
    }

    function withdrawVoteToRemoveOwner(address addr) public onlyOwners {
        return s.withdrawVoteToRemoveOwner(addr);
    }

    function addMember(bytes32 role, address addr) public onlyOwners {
        return s.addMember(role, addr);
    }

    function checkMember(bytes32 role, address addr) public view returns(bool) {
        return s.checkMember(role, addr);
    }

    function countMembers() public view returns(uint256) {
        return s.countMembers();
    }

    function getMember(uint256 index) public view returns(bytes32, address) {
        return s.getMember(index);
    }

    function removeMember(bytes32 role, address addr) public onlyOwners {
        return s.removeMember(role, addr);
    }
}

library RootImplementation {

    event GroupCreated(address addr);

    function createGroup(RootInterface.Storage storage s, address parent, bytes32 name, address[] memory owners) public returns(Group) {
        uint256 ownerCount = 0;
        for (uint256 i = 0; i < owners.length; i++) {
            if (checkMember(s, "Member", owners[i])) {
                ownerCount++;
            }
        }
        require(ownerCount > 0, "There is no valid owner.");
        address[] memory validOwners = new address[](ownerCount);
        ownerCount = 0;
        for (uint256 i = 0; i < owners.length; i++) {
            if (checkMember(s, "Member", owners[i])) {
                validOwners[ownerCount++] = owners[i];
            }
        }
        Group g = new Group(address(this), parent, name, s.ownerRemovalLimitNumerator, s.ownerRemovalLimitDenominator, validOwners);
        emit GroupCreated(address(g));
        return g;
    }

    function addSubgroup(RootInterface.Storage storage s, bytes32 name, address[] memory owners) public {
        require(!checkSubgroup(s, name), "This subgroup already exists.");
        s.subgroupIndexes[name] = s.subgroups.push(createGroup(s, address(this), name, owners));
    }

    function checkSubgroup(RootInterface.Storage storage s, bytes32 name) public view returns(bool) {
        return s.subgroupIndexes[name] > 0 && s.subgroups[s.subgroupIndexes[name] - 1].getName() == name;
    }

    function countSubgroups(RootInterface.Storage storage s) public view returns(uint256) {
        return s.subgroups.length;
    }

    function getSubgroup(RootInterface.Storage storage s, uint256 index) public view returns(Group) {
        require(index < s.subgroups.length, "This subgroup does not exist.");
        return s.subgroups[index];
    }

    function removeSubgroup(RootInterface.Storage storage s, bytes32 name) public {
        require(checkSubgroup(s, name), "This subgroup does not exist.");
        s.subgroups[s.subgroupIndexes[name] - 1] = s.subgroups[s.subgroups.length - 1];
        delete s.subgroupIndexes[name];
        delete s.subgroups[s.subgroups.length - 1];
        s.subgroups.length--;
    }

    function addOwner(RootInterface.Storage storage s, address addr) public {
        require(!checkOwner(s, addr), "This owner already exists.");
        s.ownerIndexes[addr] = s.owners.push(addr);
    }

    function checkOwner(RootInterface.Storage storage s, address addr) public view returns(bool) {
        return s.ownerIndexes[addr] > 0 && s.owners[s.ownerIndexes[addr] - 1] == addr;
    }

    function countOwners(RootInterface.Storage storage s) public view returns(uint256) {
        return s.owners.length;
    }

    function getOwner(RootInterface.Storage storage s, uint256 index) public view returns(address) {
        require(index < s.owners.length, "This owner does not exist.");
        return s.owners[index];
    }

    function checkOwnerRemovalVote(RootInterface.Storage storage s, address addr) public view returns(bool) {
        return s.ownerRemovalVoters[addr].voters[msg.sender];
    }

    function voteToRemoveOwner(RootInterface.Storage storage s, address addr) public {
        require(checkOwner(s, addr), "This owner does not exist.");
        require(!checkOwnerRemovalVote(s, addr), "This vote already exists.");
        s.ownerRemovalVoters[addr].voters[msg.sender] = true;
        s.ownerRemovalVoteCounts[addr]++;
        if (s.owners.length * s.ownerRemovalLimitNumerator / s.ownerRemovalLimitDenominator <= s.ownerRemovalVoteCounts[addr]) {
            s.owners[s.ownerIndexes[addr] - 1] = s.owners[s.owners.length - 1];
            delete s.ownerIndexes[addr];
            delete s.owners[s.owners.length - 1];
            s.owners.length--;
            delete s.ownerRemovalVoters[addr];
            delete s.ownerRemovalVoteCounts[addr];
        }
    }

    function withdrawVoteToRemoveOwner(RootInterface.Storage storage s, address addr) public {
        require(checkOwner(s, addr), "This owner does not exist.");
        require(checkOwnerRemovalVote(s, addr), "This vote does not exist.");
        delete s.ownerRemovalVoters[addr].voters[msg.sender];
        s.ownerRemovalVoteCounts[addr]--;
    }

    function addMember(RootInterface.Storage storage s, bytes32 role, address addr) public {
        require(!checkMember(s, role, addr), "This member already exists.");
        s.memberIndexes[role][addr] = s.members.push(RootInterface.User(role, addr));
    }

    function checkMember(RootInterface.Storage storage s, bytes32 role, address addr) public view returns(bool) {
        return s.memberIndexes[role][addr] > 0 && s.members[s.memberIndexes[role][addr] - 1].addr == addr;
    }

    function countMembers(RootInterface.Storage storage s) public view returns(uint256) {
        return s.members.length;
    }

    function getMember(RootInterface.Storage storage s, uint256 index) public view returns(bytes32, address) {
        require(index < s.members.length, "This member does not exist.");
        return (s.members[index].role, s.members[index].addr);
    }

    function removeMember(RootInterface.Storage storage s, bytes32 role, address addr) public {
        require(checkMember(s, role, addr), "This member does not exist.");
        s.members[s.memberIndexes[role][addr] - 1] = s.members[s.members.length - 1];
        delete s.memberIndexes[role][addr];
        delete s.members[s.members.length - 1];
        s.members.length--;
    }
}
