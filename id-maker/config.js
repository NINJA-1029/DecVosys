// ═══════════════════════════════════════════════════════════════
//  DecVoSys ID Maker — Configuration
// ═══════════════════════════════════════════════════════════════

// ── Contract address (updated after deployment) ──
// Replace this with the actual deployed address from `npm run deploy`
export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// ── Network config ──
export const CHAIN_ID = 31337;
export const CHAIN_ID_HEX = "0x7A69";
export const RPC_URL = "http://127.0.0.1:8545";
export const NETWORK_NAME = "Hardhat Local";

// ── Organisation ──
export const ORG_NAME = "DecVoSys";
export const ORG_FULL = "Decentralized Voting System";

// ── ID format ──
export const ID_PREFIX = "DVS";
export const ID_FIXED_SEGMENT = "21";
export const ID_COUNTER_START = 222;

// ── Contract ABI (VoterIDRegistry) ──
export const CONTRACT_ABI = [
  "function registerCard(string calldata _dvsId, bytes32 _dataHash) external",
  "function verifyCard(string calldata _dvsId, bytes32 _dataHash) external view returns (bool valid)",
  "function isRegistered(string calldata _dvsId) external view returns (bool)",
  "function getCard(string calldata _dvsId) external view returns (bytes32 dataHash, uint256 registeredAt, address registeredBy)",
  "function totalCards() external view returns (uint256)",
  "event CardRegistered(string indexed dvsId, bytes32 dataHash, address indexed registeredBy, uint256 timestamp)"
];
