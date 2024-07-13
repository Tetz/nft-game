// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract CryptoPet {
    struct Pet {
        string name;
        uint256 level;
        uint256 lastFed;
        uint256 lastPlayed;
    }

    mapping(address => Pet) public pets;

    event PetCreated(address indexed owner, string name);
    event PetFed(address indexed owner, string name, uint256 newLevel);
    event PetPlayed(address indexed owner, string name, uint256 newLevel);

    function createPet(string memory _name) public {
        require(bytes(pets[msg.sender].name).length == 0, "Pet already exists");

        pets[msg.sender] = Pet(_name, 1, block.timestamp, block.timestamp);
        emit PetCreated(msg.sender, _name);
    }

    function feedPet() public {
        require(bytes(pets[msg.sender].name).length > 0, "No pet found");

        Pet storage pet = pets[msg.sender];
        require(block.timestamp >= pet.lastFed + 1 days, "Pet is not hungry yet");

        pet.level++;
        pet.lastFed = block.timestamp;

        emit PetFed(msg.sender, pet.name, pet.level);
    }

    function playWithPet() public {
        require(bytes(pets[msg.sender].name).length > 0, "No pet found");

        Pet storage pet = pets[msg.sender];
        require(block.timestamp >= pet.lastPlayed + 1 days, "Pet is not ready to play yet");

        pet.level++;
        pet.lastPlayed = block.timestamp;

        emit PetPlayed(msg.sender, pet.name, pet.level);
    }

    function getPet() public view returns (string memory name, uint256 level, uint256 lastFed, uint256 lastPlayed) {
        require(bytes(pets[msg.sender].name).length > 0, "No pet found");

        Pet storage pet = pets[msg.sender];
        return (pet.name, pet.level, pet.lastFed, pet.lastPlayed);
    }

    // Fast forward time (only for testing)
    function fastForwardTime(uint256 _seconds) public {
        require(bytes(pets[msg.sender].name).length > 0, "No pet found");

        Pet storage pet = pets[msg.sender];
        pet.lastFed -= _seconds;
        pet.lastPlayed -= _seconds;
    }
}
