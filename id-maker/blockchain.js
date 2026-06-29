// ═══════════════════════════════════════════════════════════════
//  DecVoSys ID Maker — Blockchain Interaction Module
//  Handles MetaMask wallet connection and smart contract calls
// ═══════════════════════════════════════════════════════════════

import { ethers } from "ethers";
import {
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  CHAIN_ID,
  CHAIN_ID_HEX,
  RPC_URL,
  NETWORK_NAME,
} from "./config.js";

let provider = null;
let signer = null;
let contract = null;
let connectedAddress = null;

// ────────────────────────────────────────────────────────────
//  Wallet Connection
// ────────────────────────────────────────────────────────────

/**
 * Connect to MetaMask and ensure the correct network is selected.
 * @returns {{ address: string, shortAddress: string }}
 */
export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error(
      "MetaMask not detected. Please install MetaMask to use blockchain features."
    );
  }

  // Request accounts
  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });

  if (!accounts || accounts.length === 0) {
    throw new Error("No accounts found. Please unlock MetaMask.");
  }

  // Switch to the Hardhat network if needed
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CHAIN_ID_HEX }],
    });
  } catch (switchError) {
    // If the chain hasn't been added, add it
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: CHAIN_ID_HEX,
            chainName: NETWORK_NAME,
            rpcUrls: [RPC_URL],
            nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
          },
        ],
      });
    } else {
      throw switchError;
    }
  }

  // Set up ethers provider and signer
  provider = new ethers.BrowserProvider(window.ethereum);
  signer = await provider.getSigner();
  connectedAddress = await signer.getAddress();

  // Instantiate contract
  contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

  const shortAddress =
    connectedAddress.slice(0, 6) + "…" + connectedAddress.slice(-4);

  return { address: connectedAddress, shortAddress };
}

/**
 * Check if a wallet is already connected.
 */
export function isConnected() {
  return !!connectedAddress;
}

/**
 * Get the short address of the connected wallet.
 */
export function getShortAddress() {
  if (!connectedAddress) return "";
  return connectedAddress.slice(0, 6) + "…" + connectedAddress.slice(-4);
}

// ────────────────────────────────────────────────────────────
//  Contract Interactions
// ────────────────────────────────────────────────────────────

/**
 * Register a card's data hash on-chain.
 * @param {string} dvsId - The unique DVS identifier
 * @param {string} dataHashHex - The SHA-256 hash as a 0x-prefixed hex string
 * @returns {{ txHash: string }}
 */
export async function registerCardOnChain(dvsId, dataHashHex) {
  if (!contract) throw new Error("Wallet not connected");

  const tx = await contract.registerCard(dvsId, dataHashHex);
  console.log(`📝 Transaction submitted: ${tx.hash}`);

  // Wait for confirmation
  const receipt = await tx.wait();
  console.log(
    `✅ Transaction confirmed in block ${receipt.blockNumber}`
  );

  return { txHash: tx.hash };
}

/**
 * Verify a card's data hash against the on-chain record.
 * @param {string} dvsId - The unique DVS identifier
 * @param {string} dataHashHex - The SHA-256 hash to verify
 * @returns {{ valid: boolean, record: object | null }}
 */
export async function verifyCardOnChain(dvsId, dataHashHex) {
  if (!contract) {
    // For verification, we can use a read-only provider
    const readProvider = new ethers.JsonRpcProvider(RPC_URL);
    const readContract = new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      readProvider
    );

    try {
      const valid = await readContract.verifyCard(dvsId, dataHashHex);
      const [storedHash, registeredAt, registeredBy] =
        await readContract.getCard(dvsId);
      return {
        valid,
        record: {
          storedHash,
          registeredAt: Number(registeredAt),
          registeredBy,
        },
      };
    } catch (err) {
      if (err.message.includes("Card not found")) {
        return { valid: false, record: null };
      }
      throw err;
    }
  }

  try {
    const valid = await contract.verifyCard(dvsId, dataHashHex);
    const [storedHash, registeredAt, registeredBy] =
      await contract.getCard(dvsId);
    return {
      valid,
      record: {
        storedHash,
        registeredAt: Number(registeredAt),
        registeredBy,
      },
    };
  } catch (err) {
    if (err.message.includes("Card not found")) {
      return { valid: false, record: null };
    }
    throw err;
  }
}

/**
 * Check if a DVS ID has already been registered.
 * @param {string} dvsId
 * @returns {boolean}
 */
export async function isCardRegistered(dvsId) {
  const readProvider = new ethers.JsonRpcProvider(RPC_URL);
  const readContract = new ethers.Contract(
    CONTRACT_ADDRESS,
    CONTRACT_ABI,
    readProvider
  );
  return await readContract.isRegistered(dvsId);
}

// ────────────────────────────────────────────────────────────
//  Account change listener
// ────────────────────────────────────────────────────────────

export function onAccountChange(callback) {
  if (window.ethereum) {
    window.ethereum.on("accountsChanged", (accounts) => {
      if (accounts.length === 0) {
        connectedAddress = null;
        signer = null;
        contract = null;
      } else {
        connectedAddress = accounts[0];
      }
      callback(accounts);
    });
  }
}
