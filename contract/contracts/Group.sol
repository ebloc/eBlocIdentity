pragma solidity ^0.5.0;

contract Group {

    struct OwnerRemovalVoter {
        mapping(address => bool) voters;
    }

    struct User {
        bytes32 role;
        address addr;
    }

    ENSRegistry private ens;
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

    constructor(address _ens, address _parent, bytes32 _name, uint256 _ownerRemovalLimitNumerator, uint256 _ownerRemovalLimitDenominator, address[] memory _owners) public {
        ens = ENSRegistry(_ens);
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
        subgroupIndexes[_name] = subgroups.push(Root(Resolver(ens.resolver("")).addr("")).createGroup(address(this), _name, _owners));
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
        require(Root(Resolver(ens.resolver("")).addr("")).checkMember("Member", msg.sender), "This member does not belong to root.");
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
        require(Root(Resolver(ens.resolver("")).addr("")).checkMember("Member", addr), "This member does not belong to root.");
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
        require(Root(Resolver(ens.resolver("")).addr("")).checkMember("Member", addr), "This member does not belong to root.");
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
        require(Root(Resolver(ens.resolver("")).addr("")).checkMember("Member", msg.sender), "This member does not belong to root.");
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

contract RootStorage {

    struct OwnerRemovalVoter {
        mapping(address => bool) voters;
    }

    struct User {
        bytes32 role;
        address addr;
    }

    uint256 private ownerRemovalLimitNumerator;
    uint256 private ownerRemovalLimitDenominator;
    Group[] private subgroups;
    mapping(bytes32 => uint256) private subgroupIndexes;
    address[] private owners;
    mapping(address => uint256) private ownerIndexes;
    mapping(address => OwnerRemovalVoter) private ownerRemovalVoters;
    mapping(address => uint256) private ownerRemovalVoteCounts;
    User[] private members;
    mapping(bytes32 => mapping(address => uint256)) private memberIndexes;

    constructor(uint256 _ownerRemovalLimitNumerator, uint256 _ownerRemovalLimitDenominator, address[] memory _owners) public {
        ownerRemovalLimitNumerator = _ownerRemovalLimitNumerator;
        ownerRemovalLimitDenominator = _ownerRemovalLimitDenominator;
        for (uint i = 0; i < _owners.length; i++) {
            address addr = _owners[i];
            ownerIndexes[addr] = owners.push(addr);
        }
    }

    modifier onlyOwners(address caller) {
        require(checkOwner(caller), "Caller is not owner.");
        _;
    }

    function addSubgroup(address caller, bytes32 name, Group subgroup) public onlyOwners(caller) {
        require(!checkSubgroup(name), "This subgroup already exists.");
        subgroupIndexes[name] = subgroups.push(subgroup);
    }

    function checkSubgroup(bytes32 name) public view returns(bool) {
        return subgroupIndexes[name] > 0 && subgroups[subgroupIndexes[name] - 1].getName() == name;
    }

    function countSubgroups() public view returns(uint256) {
        return subgroups.length;
    }

    function getSubgroup(uint256 index) public view returns(Group) {
        require(index < subgroups.length, "This subgroup does not exist.");
        return subgroups[index];
    }

    function removeSubgroup(address caller, bytes32 name) public onlyOwners(caller) {
        require(checkSubgroup(name), "This subgroup does not exist.");
        subgroups[subgroupIndexes[name] - 1] = subgroups[subgroups.length - 1];
        delete subgroupIndexes[name];
        delete subgroups[subgroups.length - 1];
        subgroups.length--;
    }

    function getOwnerRemovalLimitNumerator() public view returns(uint256) {
        return ownerRemovalLimitNumerator;
    }

    function getOwnerRemovalLimitDenominator() public view returns(uint256) {
        return ownerRemovalLimitDenominator;
    }

    function addOwner(address caller, address addr) public onlyOwners(caller) {
        require(!checkOwner(addr), "This owner already exists.");
        ownerIndexes[addr] = owners.push(addr);
    }

    function checkOwner(address addr) public view returns(bool) {
        return ownerIndexes[addr] > 0 && owners[ownerIndexes[addr] - 1] == addr;
    }

    function countOwners(address caller) public view onlyOwners(caller) returns(uint256) {
        return owners.length;
    }

    function getOwner(address caller, uint256 index) public view onlyOwners(caller) returns(address) {
        require(index < owners.length, "This owner does not exist.");
        return owners[index];
    }

    function checkOwnerRemovalVote(address caller, address addr) public view onlyOwners(caller) returns(bool) {
        return ownerRemovalVoters[addr].voters[caller];
    }

    function voteToRemoveOwner(address caller, address addr) public onlyOwners(caller) {
        require(checkOwner(addr), "This owner does not exist.");
        require(!checkOwnerRemovalVote(caller, addr), "This vote already exists.");
        ownerRemovalVoters[addr].voters[caller] = true;
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

    function withdrawVoteToRemoveOwner(address caller, address addr) public onlyOwners(caller) {
        require(checkOwner(addr), "This owner does not exist.");
        require(checkOwnerRemovalVote(caller, addr), "This vote does not exist.");
        delete ownerRemovalVoters[addr].voters[caller];
        ownerRemovalVoteCounts[addr]--;
    }

    function addMember(address caller, bytes32 role, address addr) public onlyOwners(caller) {
        require(!checkMember(role, addr), "This member already exists.");
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

    function removeMember(address caller, bytes32 role, address addr) public onlyOwners(caller) {
        require(checkMember(role, addr), "This member does not exist.");
        members[memberIndexes[role][addr] - 1] = members[members.length - 1];
        delete memberIndexes[role][addr];
        delete members[members.length - 1];
        members.length--;
    }
}

contract Root {

    address private ens;

    RootStorage private store;

    event GroupCreated(address addr);

    constructor(address _ens, address _store) public {
        ens = _ens;
        store = RootStorage(_store);
    }

    function createGroup(address parent, bytes32 name, address[] memory owners) public returns(Group) {
        uint256 ownerCount = 0;
        for (uint256 i = 0; i < owners.length; i++) {
            if (checkMember("Member", owners[i])) {
                ownerCount++;
            }
        }
        require(ownerCount > 0, "There is no valid owner.");
        address[] memory validOwners = new address[](ownerCount);
        ownerCount = 0;
        for (uint256 i = 0; i < owners.length; i++) {
            if (checkMember("Member", owners[i])) {
                validOwners[ownerCount++] = owners[i];
            }
        }
        Group g = new Group(ens, parent, name, store.getOwnerRemovalLimitNumerator(), store.getOwnerRemovalLimitDenominator(), validOwners);
        emit GroupCreated(address(g));
        return g;
    }

    function addSubgroup(bytes32 name, address[] memory owners) public {
        store.addSubgroup(msg.sender, name, createGroup(address(this), name, owners));
    }

    function checkSubgroup(bytes32 name) public view returns(bool) {
        return store.checkSubgroup(name);
    }

    function countSubgroups() public view returns(uint256) {
        return store.countSubgroups();
    }

    function getSubgroup(uint256 index) public view returns(Group) {
        return store.getSubgroup(index);
    }

    function removeSubgroup(bytes32 name) public {
        store.removeSubgroup(msg.sender, name);
    }

    function addOwner(address addr) public {
        store.addOwner(msg.sender, addr);
    }

    function checkOwner(address addr) public view returns(bool) {
        return store.checkOwner(addr);
    }

    function countOwners() public view returns(uint256) {
        return store.countOwners(msg.sender);
    }

    function getOwner(uint256 index) public view returns(address) {
        return store.getOwner(msg.sender, index);
    }

    function checkOwnerRemovalVote(address addr) public view returns(bool) {
        return store.checkOwnerRemovalVote(msg.sender, addr);
    }

    function voteToRemoveOwner(address addr) public {
        store.voteToRemoveOwner(msg.sender, addr);
    }

    function withdrawVoteToRemoveOwner(address addr) public {
        store.withdrawVoteToRemoveOwner(msg.sender, addr);
    }

    function addMember(bytes32 role, address addr) public {
        store.addMember(msg.sender, role, addr);
    }

    function checkMember(bytes32 role, address addr) public view returns(bool) {
        return store.checkMember(role, addr);
    }

    function countMembers() public view returns(uint256) {
        return store.countMembers();
    }

    function getMember(uint256 index) public view returns(bytes32, address) {
        return store.getMember(index);
    }

    function removeMember(bytes32 role, address addr) public {
        store.removeMember(msg.sender, role, addr);
    }
}

contract ENSRegistry {

    struct Record {
        address owner;
        address resolver;
        uint64 ttl;
    }

    mapping(bytes32 => Record) private records;

    event NewOwner(bytes32 indexed node, bytes32 indexed label, address owner);
    event Transfer(bytes32 indexed node, address owner);
    event NewResolver(bytes32 indexed node, address resolver);
    event NewTTL(bytes32 indexed node, uint64 ttl);

    constructor(address owner) public {
        records[0].owner = owner;
    }

    modifier onlyOwner(bytes32 node) {
        require(records[node].owner == msg.sender, "Caller is not owner.");
        _;
    }

    function owner(bytes32 node) public view returns(address) {
        return records[node].owner;
    }

    function resolver(bytes32 node) public view returns(address) {
        return records[node].resolver;
    }

    function ttl(bytes32 node) public view returns(uint64) {
        return records[node].ttl;
    }

    function setOwner(bytes32 node, address _owner) public onlyOwner(node) {
        emit Transfer(node, _owner);
        records[node].owner = _owner;
    }

    function setSubnodeOwner(bytes32 node, bytes32 label, address _owner) public onlyOwner(node) {
        bytes32 subnode = keccak256(abi.encodePacked(node, label));
        emit NewOwner(node, label, _owner);
        records[subnode].owner = _owner;
    }

    function setResolver(bytes32 node, address _resolver) public onlyOwner(node) {
        emit NewResolver(node, _resolver);
        records[node].resolver = _resolver;
    }

    function setTTL(bytes32 node, uint64 _ttl) public onlyOwner(node) {
        emit NewTTL(node, _ttl);
        records[node].ttl = _ttl;
    }
}

contract Resolver {

    address private owner;
    mapping(bytes32 => address) private addresses;

    event AddrChanged(bytes32 indexed node, address addr);

    constructor() public {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not owner.");
        _;
    }

    function addr(bytes32 node) public view returns(address) {
        return addresses[node];
    }

    function setAddr(bytes32 node, address _addr) public onlyOwner {
        addresses[node] = _addr;
        emit AddrChanged(node, _addr);
    }

    function supportsInterface(bytes4 interfaceID) public pure returns(bool) {
        return interfaceID == 0x3b3b57de || interfaceID == 0x01ffc9a7;
    }

    function() external {
        revert("No function found.");
    }
}
