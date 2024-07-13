// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract CryptoPet {
    struct Pet {
        string name;
        uint256 level;
        uint256 lastFed;
        uint256 lastPlayed;
        bytes pixelData;
    }

    mapping(address => Pet) public pets;

    event PetCreated(address indexed owner, string name, bytes pixelData);
    event PetFed(address indexed owner, string name, uint256 newLevel, bytes pixelData);
    event PetPlayed(address indexed owner, string name, uint256 newLevel, bytes pixelData);

    function createPet(string memory _name) public {
        require(bytes(pets[msg.sender].name).length == 0, "Pet already exists");

        bytes memory pixelData = generateRandomPixelData();
        pets[msg.sender] = Pet(_name, 1, block.timestamp, block.timestamp, pixelData);
        emit PetCreated(msg.sender, _name, pixelData);
    }

    function feedPet() public {
        require(bytes(pets[msg.sender].name).length > 0, "No pet found");

        Pet storage pet = pets[msg.sender];
        require(block.timestamp >= pet.lastFed + 1 days, "Pet is not hungry yet");

        pet.level++;
        pet.lastFed = block.timestamp;
        pet.pixelData = generateRandomPixelData(); // Update pixel data

        emit PetFed(msg.sender, pet.name, pet.level, pet.pixelData);
    }

    function playWithPet() public {
        require(bytes(pets[msg.sender].name).length > 0, "No pet found");

        Pet storage pet = pets[msg.sender];
        require(block.timestamp >= pet.lastPlayed + 1 days, "Pet is not ready to play yet");

        pet.level++;
        pet.lastPlayed = block.timestamp;
        pet.pixelData = generateRandomPixelData(); // Update pixel data

        emit PetPlayed(msg.sender, pet.name, pet.level, pet.pixelData);
    }

    function getPet() public view returns (string memory name, uint256 level, uint256 lastFed, uint256 lastPlayed, bytes memory pixelData) {
        require(bytes(pets[msg.sender].name).length > 0, "No pet found");

        Pet storage pet = pets[msg.sender];
        return (pet.name, pet.level, pet.lastFed, pet.lastPlayed, pet.pixelData);
    }

    function generateRandomPixelData() internal view returns (bytes memory) {
        bytes memory pixelData = new bytes(100); // 10x10 pixel grid
        for (uint i = 0; i < 100; i++) {
            pixelData[i] = bytes1(uint8(uint(keccak256(abi.encodePacked(block.timestamp, msg.sender, i))) % 2 == 0 ? 0 : 1));
        }
        return pixelData;
    }

    // Fast forward time (only for testing)
    function fastForwardTime(uint256 _seconds) public {
        require(bytes(pets[msg.sender].name).length > 0, "No pet found");

        Pet storage pet = pets[msg.sender];
        pet.lastFed -= _seconds;
        pet.lastPlayed -= _seconds;
    }
}
