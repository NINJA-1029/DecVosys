// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Voting is Ownable {
    // We pass msg.sender as the initial owner to the Ownable constructor.
    constructor() Ownable(msg.sender) {}

    struct Candidate {
        uint256 id;
        string name;
        string party;
        string symbolURI;
        uint256 voteCount;
    }

    struct Election {
        string title;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
    }

    Election public currentElection;
    
    mapping(uint256 => Candidate) public candidates;
    uint256 public candidatesCount;

    // Mapping to track if an address has voted
    mapping(address => bool) public hasVoted;

    event ElectionCreated(string title, uint256 duration);
    event CandidateAdded(uint256 id, string name, string party);
    event VoteCast(address indexed voter, uint256 indexed candidateId);
    event ElectionEnded(string title);

    function createElection(string memory _title, uint256 _durationInMinutes) external onlyOwner {
        require(!currentElection.isActive, "An election is already active.");
        currentElection = Election({
            title: _title,
            startTime: block.timestamp,
            endTime: block.timestamp + (_durationInMinutes * 1 minutes),
            isActive: true
        });
        emit ElectionCreated(_title, _durationInMinutes);
    }

    function addCandidate(string memory _name, string memory _party, string memory _symbolURI) external onlyOwner {
        require(currentElection.isActive, "No active election to add candidates to.");
        candidatesCount++;
        candidates[candidatesCount] = Candidate({
            id: candidatesCount,
            name: _name,
            party: _party,
            symbolURI: _symbolURI,
            voteCount: 0
        });
        emit CandidateAdded(candidatesCount, _name, _party);
    }

    function vote(uint256 _candidateId) external {
        require(currentElection.isActive, "Election is not active.");
        require(block.timestamp >= currentElection.startTime && block.timestamp <= currentElection.endTime, "Election is not within the voting period.");
        require(!hasVoted[msg.sender], "You have already voted.");
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate ID.");

        hasVoted[msg.sender] = true;
        candidates[_candidateId].voteCount++;

        emit VoteCast(msg.sender, _candidateId);
    }

    function endElection() external onlyOwner {
        require(currentElection.isActive, "No active election to end.");
        currentElection.isActive = false;
        emit ElectionEnded(currentElection.title);
    }

    function getAllCandidates() external view returns (Candidate[] memory) {
        Candidate[] memory candidateArray = new Candidate[](candidatesCount);
        for (uint256 i = 1; i <= candidatesCount; i++) {
            candidateArray[i - 1] = candidates[i];
        }
        return candidateArray;
    }

    function getElectionDetails() external view returns (string memory, uint256, uint256, bool) {
        return (
            currentElection.title,
            currentElection.startTime,
            currentElection.endTime,
            currentElection.isActive
        );
    }
}
