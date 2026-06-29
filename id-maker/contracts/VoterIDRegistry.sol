// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title VoterIDRegistry
 * @notice Immutable on-chain registry for Decvosys voter ID cards.
 *         Stores SHA-256 hashes of card data so that any tampered card
 *         can be instantly detected during QR-code scanning.
 */
contract VoterIDRegistry is Ownable {
    struct CardRecord {
        bytes32 dataHash;        // SHA-256 of (dvsId + name + mobile + photoHash)
        uint256 registeredAt;    // block.timestamp when registered
        address registeredBy;    // wallet that registered the card
    }

    /// @dev dvsId string → CardRecord
    mapping(string => CardRecord) private _cards;

    /// @dev running count of all registered cards
    uint256 public totalCards;

    /// @dev emitted when a new card is registered on-chain
    event CardRegistered(
        string indexed dvsId,
        bytes32 dataHash,
        address indexed registeredBy,
        uint256 timestamp
    );

    constructor() Ownable(msg.sender) {}

    // ────────────────────────────────────────────────────────────
    //  Write
    // ────────────────────────────────────────────────────────────

    /**
     * @notice Register a voter ID card hash on-chain.
     * @param _dvsId  The unique DVS identifier (e.g. "DVS2621222").
     * @param _dataHash  SHA-256 hash of the card's payload data.
     */
    function registerCard(string calldata _dvsId, bytes32 _dataHash) external onlyOwner {
        require(_cards[_dvsId].registeredAt == 0, "Card already registered");
        require(_dataHash != bytes32(0), "Hash cannot be zero");

        _cards[_dvsId] = CardRecord({
            dataHash: _dataHash,
            registeredAt: block.timestamp,
            registeredBy: msg.sender
        });

        totalCards++;
        emit CardRegistered(_dvsId, _dataHash, msg.sender, block.timestamp);
    }

    // ────────────────────────────────────────────────────────────
    //  Read
    // ────────────────────────────────────────────────────────────

    /**
     * @notice Verify whether the supplied hash matches the stored record.
     * @return valid  true if the hashes match
     */
    function verifyCard(string calldata _dvsId, bytes32 _dataHash) external view returns (bool valid) {
        CardRecord memory card = _cards[_dvsId];
        require(card.registeredAt != 0, "Card not found");
        return card.dataHash == _dataHash;
    }

    /**
     * @notice Check if a DVS ID has been registered.
     */
    function isRegistered(string calldata _dvsId) external view returns (bool) {
        return _cards[_dvsId].registeredAt != 0;
    }

    /**
     * @notice Retrieve the full on-chain record for a DVS ID.
     */
    function getCard(string calldata _dvsId)
        external
        view
        returns (bytes32 dataHash, uint256 registeredAt, address registeredBy)
    {
        CardRecord memory card = _cards[_dvsId];
        require(card.registeredAt != 0, "Card not found");
        return (card.dataHash, card.registeredAt, card.registeredBy);
    }
}
