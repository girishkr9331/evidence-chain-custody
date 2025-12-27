// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract EvidenceChainOfCustody {
    
    enum Role { NONE, POLICE, INVESTIGATOR, FORENSIC_LAB, COURT, CYBER_UNIT }
    enum ActionType { COLLECTED, UPLOADED, ACCESSED, TRANSFERRED, ANALYZED, VERIFIED, MODIFIED }
    
    struct User {
        address userAddress;
        Role role;
        string name;
        string department;
        bool isActive;
        uint256 registeredAt;
    }
    
    struct Evidence {
        string evidenceId;
        string evidenceHash;
        string metadata;
        address collector;
        address currentCustodian;
        uint256 createdAt;
        bool isActive;
        string caseId;
    }
    
    struct AuditLog {
        string evidenceId;
        ActionType action;
        address actor;
        address transferTo;
        uint256 timestamp;
        string notes;
        string previousHash;
        string newHash;
    }
    
    struct Alert {
        string evidenceId;
        address triggeredBy;
        string alertType;
        string message;
        uint256 timestamp;
        bool resolved;
    }
    
    address public admin;
    uint256 public totalEvidence;
    uint256 public totalAuditLogs;
    uint256 public totalAlerts;
    
    mapping(address => User) public users;
    mapping(string => Evidence) public evidenceRegistry;
    mapping(string => AuditLog[]) public evidenceAuditTrail;
    mapping(string => bool) public evidenceExists;
    mapping(uint256 => Alert) public alerts;
    
    address[] public registeredUsers;
    string[] public evidenceIds;
    
    event UserRegistered(address indexed userAddress, Role role, string name);
    event EvidenceRegistered(string indexed evidenceId, address indexed collector, string evidenceHash);
    event EvidenceAccessed(string indexed evidenceId, address indexed accessor, uint256 timestamp);
    event EvidenceTransferred(string indexed evidenceId, address indexed from, address indexed to, uint256 timestamp);
    event EvidenceVerified(string indexed evidenceId, address indexed verifier, bool isValid);
    event AlertTriggered(uint256 indexed alertId, string evidenceId, address triggeredBy, string alertType);
    event AuditLogCreated(string indexed evidenceId, ActionType action, address indexed actor);
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    modifier onlyAuthorized() {
        require(users[msg.sender].isActive, "User not authorized");
        _;
    }
    
    modifier onlyAdminOrInvestigator() {
        require(
            msg.sender == admin || users[msg.sender].role == Role.INVESTIGATOR,
            "Only admin or investigator can perform this action"
        );
        _;
    }
    
    modifier evidenceExistsCheck(string memory _evidenceId) {
        require(evidenceExists[_evidenceId], "Evidence does not exist");
        _;
    }
    
    constructor() {
        admin = msg.sender;
        users[admin] = User({
            userAddress: admin,
            role: Role.POLICE,
            name: "System Admin",
            department: "Administration",
            isActive: true,
            registeredAt: block.timestamp
        });
        registeredUsers.push(admin);
    }
    
    function registerUser(
        address _userAddress,
        Role _role,
        string memory _name,
        string memory _department
    ) public onlyAdmin {
        require(!users[_userAddress].isActive, "User already registered");
        require(_role != Role.NONE, "Invalid role");
        
        users[_userAddress] = User({
            userAddress: _userAddress,
            role: _role,
            name: _name,
            department: _department,
            isActive: true,
            registeredAt: block.timestamp
        });
        
        registeredUsers.push(_userAddress);
        emit UserRegistered(_userAddress, _role, _name);
    }
    
    function registerEvidence(
        string memory _evidenceId,
        string memory _evidenceHash,
        string memory _metadata,
        string memory _caseId
    ) public onlyAuthorized {
        require(!evidenceExists[_evidenceId], "Evidence already exists");
        require(bytes(_evidenceHash).length > 0, "Evidence hash required");
        
        evidenceRegistry[_evidenceId] = Evidence({
            evidenceId: _evidenceId,
            evidenceHash: _evidenceHash,
            metadata: _metadata,
            collector: msg.sender,
            currentCustodian: msg.sender,
            createdAt: block.timestamp,
            isActive: true,
            caseId: _caseId
        });
        
        evidenceExists[_evidenceId] = true;
        evidenceIds.push(_evidenceId);
        totalEvidence++;
        
        _createAuditLog(
            _evidenceId,
            ActionType.COLLECTED,
            msg.sender,
            address(0),
            "Evidence collected and registered",
            "",
            _evidenceHash
        );
        
        emit EvidenceRegistered(_evidenceId, msg.sender, _evidenceHash);
    }
    
    function accessEvidence(
        string memory _evidenceId,
        string memory _notes
    ) public onlyAuthorized evidenceExistsCheck(_evidenceId) {
        Evidence storage evidence = evidenceRegistry[_evidenceId];
        
        // Check if user has permission
        bool hasPermission = _checkAccessPermission(msg.sender, evidence);
        
        if (!hasPermission) {
            _triggerAlert(
                _evidenceId,
                msg.sender,
                "UNAUTHORIZED_ACCESS",
                "Unauthorized access attempt detected"
            );
            revert("Access denied");
        }
        
        _createAuditLog(
            _evidenceId,
            ActionType.ACCESSED,
            msg.sender,
            address(0),
            _notes,
            evidence.evidenceHash,
            evidence.evidenceHash
        );
        
        emit EvidenceAccessed(_evidenceId, msg.sender, block.timestamp);
    }
    
    function transferEvidence(
        string memory _evidenceId,
        address _to,
        string memory _notes
    ) public onlyAuthorized evidenceExistsCheck(_evidenceId) {
        Evidence storage evidence = evidenceRegistry[_evidenceId];
        require(evidence.currentCustodian == msg.sender, "Not current custodian");
        require(users[_to].isActive, "Recipient not authorized");
        
        address previousCustodian = evidence.currentCustodian;
        evidence.currentCustodian = _to;
        
        _createAuditLog(
            _evidenceId,
            ActionType.TRANSFERRED,
            msg.sender,
            _to,
            _notes,
            evidence.evidenceHash,
            evidence.evidenceHash
        );
        
        emit EvidenceTransferred(_evidenceId, previousCustodian, _to, block.timestamp);
    }
    
    function verifyEvidenceIntegrity(
        string memory _evidenceId,
        string memory _currentHash
    ) public view evidenceExistsCheck(_evidenceId) returns (bool) {
        Evidence storage evidence = evidenceRegistry[_evidenceId];
        return keccak256(abi.encodePacked(evidence.evidenceHash)) == 
               keccak256(abi.encodePacked(_currentHash));
    }
    
    function updateEvidenceHash(
        string memory _evidenceId,
        string memory _newHash,
        string memory _notes
    ) public onlyAuthorized evidenceExistsCheck(_evidenceId) {
        Evidence storage evidence = evidenceRegistry[_evidenceId];
        require(evidence.currentCustodian == msg.sender, "Not current custodian");
        
        string memory previousHash = evidence.evidenceHash;
        evidence.evidenceHash = _newHash;
        
        _createAuditLog(
            _evidenceId,
            ActionType.MODIFIED,
            msg.sender,
            address(0),
            _notes,
            previousHash,
            _newHash
        );
    }
    
    function _createAuditLog(
        string memory _evidenceId,
        ActionType _action,
        address _actor,
        address _transferTo,
        string memory _notes,
        string memory _previousHash,
        string memory _newHash
    ) internal {
        evidenceAuditTrail[_evidenceId].push(AuditLog({
            evidenceId: _evidenceId,
            action: _action,
            actor: _actor,
            transferTo: _transferTo,
            timestamp: block.timestamp,
            notes: _notes,
            previousHash: _previousHash,
            newHash: _newHash
        }));
        
        totalAuditLogs++;
        emit AuditLogCreated(_evidenceId, _action, _actor);
    }
    
    function _triggerAlert(
        string memory _evidenceId,
        address _triggeredBy,
        string memory _alertType,
        string memory _message
    ) internal {
        alerts[totalAlerts] = Alert({
            evidenceId: _evidenceId,
            triggeredBy: _triggeredBy,
            alertType: _alertType,
            message: _message,
            timestamp: block.timestamp,
            resolved: false
        });
        
        emit AlertTriggered(totalAlerts, _evidenceId, _triggeredBy, _alertType);
        totalAlerts++;
    }
    
    function _checkAccessPermission(address _user, Evidence storage _evidence) internal view returns (bool) {
        User storage user = users[_user];
        
        // Collector always has access
        if (_evidence.collector == _user) return true;
        
        // Current custodian has access
        if (_evidence.currentCustodian == _user) return true;
        
        // Courts and cyber units have read access to all evidence
        if (user.role == Role.COURT || user.role == Role.CYBER_UNIT) return true;
        
        return false;
    }
    
    function getAuditTrail(string memory _evidenceId) 
        public 
        view 
        evidenceExistsCheck(_evidenceId) 
        returns (AuditLog[] memory) 
    {
        return evidenceAuditTrail[_evidenceId];
    }
    
    function getEvidence(string memory _evidenceId) 
        public 
        view 
        evidenceExistsCheck(_evidenceId) 
        returns (Evidence memory) 
    {
        return evidenceRegistry[_evidenceId];
    }
    
    function getUser(address _userAddress) public view returns (User memory) {
        return users[_userAddress];
    }
    
    function getAllEvidenceIds() public view returns (string[] memory) {
        return evidenceIds;
    }
    
    function getAllUsers() public view returns (address[] memory) {
        return registeredUsers;
    }
    
    function getAlert(uint256 _alertId) public view returns (Alert memory) {
        return alerts[_alertId];
    }
    
    function triggerAlert(
        string memory _evidenceId,
        string memory _alertType,
        string memory _message
    ) public onlyAuthorized evidenceExistsCheck(_evidenceId) {
        _triggerAlert(_evidenceId, msg.sender, _alertType, _message);
    }
    
    function resolveAlert(uint256 _alertId) public onlyAdminOrInvestigator {
        require(_alertId < totalAlerts, "Invalid alert ID");
        require(!alerts[_alertId].resolved, "Alert already resolved");
        alerts[_alertId].resolved = true;
    }
    
    function toggleUserStatus(address _userAddress) public onlyAdmin {
        users[_userAddress].isActive = !users[_userAddress].isActive;
    }
    
    function deactivateUser(address _userAddress) public onlyAdmin {
        users[_userAddress].isActive = false;
    }
    
    function activateUser(address _userAddress) public onlyAdmin {
        users[_userAddress].isActive = true;
    }
}
