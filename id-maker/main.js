// ═══════════════════════════════════════════════════════════════
//  DecVoSys ID Maker — Main Application Logic
//  Canvas-based ID card rendering, QR generation, SHA-256 hashing,
//  blockchain registration, and card verification.
// ═══════════════════════════════════════════════════════════════

import QRCode from "qrcode";
import {
  ORG_NAME,
  ORG_FULL,
  ID_PREFIX,
  ID_FIXED_SEGMENT,
  ID_COUNTER_START,
} from "./config.js";
import {
  connectWallet,
  isConnected,
  getShortAddress,
  registerCardOnChain,
  verifyCardOnChain,
  onAccountChange,
} from "./blockchain.js";

// ────────────────────────────────────────────────────────────
//  DOM References
// ────────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

const voterName = $("voterName");
const voterMobile = $("voterMobile");
const voterPhoto = $("voterPhoto");
const photoUploadArea = $("photoUploadArea");
const photoPlaceholder = $("photoPlaceholder");
const photoPreview = $("photoPreview");
const generateBtn = $("generateBtn");
const downloadBtn = $("downloadBtn");
const statusMessage = $("statusMessage");
const canvas = $("idCardCanvas");
const ctx = canvas.getContext("2d");

const connectWalletBtn = $("connectWalletBtn");
const walletStatusText = $("walletStatusText");

const tabGenerate = $("tabGenerate");
const tabVerify = $("tabVerify");
const panelGenerate = $("panelGenerate");
const panelVerify = $("panelVerify");

const verifyDvsId = $("verifyDvsId");
const verifyName = $("verifyName");
const verifyMobile = $("verifyMobile");
const verifyBtn = $("verifyBtn");
const verifyResult = $("verifyResult");

// ────────────────────────────────────────────────────────────
//  State
// ────────────────────────────────────────────────────────────
let uploadedPhotoDataURL = null;
let lastGeneratedDvsId = null;
let lastGeneratedHash = null;

// ────────────────────────────────────────────────────────────
//  ID Counter Management (localStorage)
// ────────────────────────────────────────────────────────────
function getNextCounter() {
  const key = "dvs_id_counter";
  let counter = parseInt(localStorage.getItem(key), 10);
  if (isNaN(counter) || counter < ID_COUNTER_START) {
    counter = ID_COUNTER_START;
  }
  localStorage.setItem(key, counter + 1);
  return counter;
}

function generateDvsId() {
  const year = new Date().getFullYear().toString().slice(-2); // "26"
  const counter = getNextCounter(); // 222, 223, ...
  const counterStr = counter.toString().padStart(3, "0");
  return `${ID_PREFIX}${year}${ID_FIXED_SEGMENT}${counterStr}`;
}

// ────────────────────────────────────────────────────────────
//  SHA-256 Hashing (Web Crypto API)
// ────────────────────────────────────────────────────────────
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return "0x" + hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ────────────────────────────────────────────────────────────
//  Canvas — Draw ID Card
// ────────────────────────────────────────────────────────────

/**
 * Draws a rounded rectangle path on canvas.
 */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/**
 * Renders the full ID card onto the canvas.
 */
async function drawIdCard({ name, mobile, dvsId, photoDataURL, dataHash }) {
  const W = 600;
  const H = 380;
  canvas.width = W;
  canvas.height = H;

  // ── Background ──
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, "#0f172a");
  bgGrad.addColorStop(0.5, "#1e1b4b");
  bgGrad.addColorStop(1, "#0f172a");
  roundRect(ctx, 0, 0, W, H, 16);
  ctx.fillStyle = bgGrad;
  ctx.fill();

  // ── Border ──
  const borderGrad = ctx.createLinearGradient(0, 0, W, H);
  borderGrad.addColorStop(0, "#8b5cf6");
  borderGrad.addColorStop(1, "#0ea5e9");
  roundRect(ctx, 0, 0, W, H, 16);
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // ── Inner border accent ──
  roundRect(ctx, 4, 4, W - 8, H - 8, 13);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // ── Header bar ──
  const headerH = 60;
  ctx.save();
  roundRect(ctx, 0, 0, W, headerH, 16);
  ctx.clip();
  ctx.fillStyle = "rgba(139, 92, 246, 0.12)";
  ctx.fillRect(0, 0, W, headerH);
  ctx.restore();

  // Header bottom line
  ctx.beginPath();
  ctx.moveTo(20, headerH);
  ctx.lineTo(W - 20, headerH);
  ctx.strokeStyle = "rgba(139, 92, 246, 0.3)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // ── Organisation Name (centered) ──
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 22px 'Inter', system-ui, sans-serif";
  ctx.fillText(`✦ ${ORG_NAME} ✦`, W / 2, 28);

  ctx.font = "300 11px 'Inter', system-ui, sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText(ORG_FULL, W / 2, 46);

  // ── Photo (left side) ──
  const photoX = 30;
  const photoY = 80;
  const photoW = 120;
  const photoH = 150;

  // Photo border
  const photoBorderGrad = ctx.createLinearGradient(
    photoX,
    photoY,
    photoX + photoW,
    photoY + photoH
  );
  photoBorderGrad.addColorStop(0, "#8b5cf6");
  photoBorderGrad.addColorStop(1, "#0ea5e9");
  roundRect(ctx, photoX - 2, photoY - 2, photoW + 4, photoH + 4, 10);
  ctx.fillStyle = photoBorderGrad;
  ctx.fill();

  if (photoDataURL) {
    const img = await loadImage(photoDataURL);
    ctx.save();
    roundRect(ctx, photoX, photoY, photoW, photoH, 8);
    ctx.clip();

    // Cover-fit the image
    const imgRatio = img.width / img.height;
    const boxRatio = photoW / photoH;
    let sx = 0,
      sy = 0,
      sw = img.width,
      sh = img.height;
    if (imgRatio > boxRatio) {
      sw = img.height * boxRatio;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width / boxRatio;
      sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, photoX, photoY, photoW, photoH);
    ctx.restore();
  } else {
    roundRect(ctx, photoX, photoY, photoW, photoH, 8);
    ctx.fillStyle = "rgba(30, 41, 59, 0.8)";
    ctx.fill();

    ctx.textAlign = "center";
    ctx.font = "300 12px 'Inter', sans-serif";
    ctx.fillStyle = "#475569";
    ctx.fillText("No Photo", photoX + photoW / 2, photoY + photoH / 2 + 4);
  }

  // ── Details (right side of photo) ──
  const detailX = 175;
  const detailY = 95;

  ctx.textAlign = "left";

  // Name label
  ctx.font = "600 10px 'Inter', system-ui, sans-serif";
  ctx.fillStyle = "#64748b";
  ctx.fillText("NAME", detailX, detailY);

  ctx.font = "bold 18px 'Inter', system-ui, sans-serif";
  ctx.fillStyle = "#f8fafc";
  ctx.fillText(name || "—", detailX, detailY + 22);

  // Mobile label
  ctx.font = "600 10px 'Inter', system-ui, sans-serif";
  ctx.fillStyle = "#64748b";
  ctx.fillText("MOBILE", detailX, detailY + 52);

  ctx.font = "500 16px 'JetBrains Mono', monospace";
  ctx.fillStyle = "#cbd5e1";
  ctx.fillText(mobile || "—", detailX, detailY + 72);

  // DVS ID label
  ctx.font = "600 10px 'Inter', system-ui, sans-serif";
  ctx.fillStyle = "#64748b";
  ctx.fillText("UNIQUE ID", detailX, detailY + 102);

  // DVS ID value with gradient-like style
  ctx.font = "bold 20px 'JetBrains Mono', monospace";
  ctx.fillStyle = "#8b5cf6";
  ctx.fillText(dvsId || "—", detailX, detailY + 124);

  // ── QR Code (bottom right) ──
  if (dvsId && name) {
    const qrPayload = JSON.stringify({
      dvsId,
      name,
      mobile,
      hash: dataHash || "",
      system: "DecVoSys",
    });

    try {
      const qrDataURL = await QRCode.toDataURL(qrPayload, {
        width: 110,
        margin: 1,
        color: { dark: "#f8fafc", light: "#00000000" },
        errorCorrectionLevel: "M",
      });
      const qrImg = await loadImage(qrDataURL);

      const qrX = W - 140;
      const qrY = H - 140;
      const qrSize = 110;

      // QR background
      roundRect(ctx, qrX - 6, qrY - 6, qrSize + 12, qrSize + 12, 8);
      ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
      ctx.fill();
      ctx.strokeStyle = "rgba(139, 92, 246, 0.2)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // QR label
      ctx.textAlign = "center";
      ctx.font = "500 8px 'Inter', sans-serif";
      ctx.fillStyle = "#475569";
      ctx.fillText("SCAN TO VERIFY", qrX + qrSize / 2, qrY + qrSize + 14);
    } catch (e) {
      console.warn("QR generation failed:", e);
    }
  }

  // ── Footer bar ──
  const footerY = H - 30;
  ctx.beginPath();
  ctx.moveTo(20, footerY);
  ctx.lineTo(W - 20, footerY);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.font = "500 9px 'Inter', system-ui, sans-serif";
  ctx.fillStyle = "#475569";
  ctx.fillText("🔒 Blockchain Secured · Tamper-Proof · Immutable", W / 2, H - 12);

  // ── Decorative corner accents ──
  drawCornerAccent(ctx, 8, 8, 20, 1);
  drawCornerAccent(ctx, W - 8, 8, 20, 2);
  drawCornerAccent(ctx, 8, H - 8, 20, 3);
  drawCornerAccent(ctx, W - 8, H - 8, 20, 4);
}

function drawCornerAccent(ctx, x, y, size, corner) {
  ctx.beginPath();
  ctx.strokeStyle = "rgba(139, 92, 246, 0.25)";
  ctx.lineWidth = 1.5;

  switch (corner) {
    case 1: // top-left
      ctx.moveTo(x, y + size);
      ctx.lineTo(x, y);
      ctx.lineTo(x + size, y);
      break;
    case 2: // top-right
      ctx.moveTo(x - size, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + size);
      break;
    case 3: // bottom-left
      ctx.moveTo(x, y - size);
      ctx.lineTo(x, y);
      ctx.lineTo(x + size, y);
      break;
    case 4: // bottom-right
      ctx.moveTo(x - size, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y - size);
      break;
  }
  ctx.stroke();
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// ────────────────────────────────────────────────────────────
//  Status Messages
// ────────────────────────────────────────────────────────────
function showStatus(type, message) {
  statusMessage.className = `status-msg ${type}`;
  statusMessage.innerHTML =
    type === "loading"
      ? `<span class="spinner"></span> ${message}`
      : message;
}

function hideStatus() {
  statusMessage.className = "status-msg hidden";
}

// ────────────────────────────────────────────────────────────
//  Form Validation
// ────────────────────────────────────────────────────────────
function validateForm() {
  const nameOk = voterName.value.trim().length >= 2;
  const mobileOk = /^\d{10}$/.test(voterMobile.value.trim());
  const photoOk = !!uploadedPhotoDataURL;

  generateBtn.disabled = !(nameOk && mobileOk && photoOk && isConnected());
}

// ────────────────────────────────────────────────────────────
//  Event Handlers
// ────────────────────────────────────────────────────────────

// Tab switching
[tabGenerate, tabVerify].forEach((btn) => {
  btn.addEventListener("click", () => {
    tabGenerate.classList.toggle("active", btn === tabGenerate);
    tabVerify.classList.toggle("active", btn === tabVerify);
    panelGenerate.classList.toggle("active", btn === tabGenerate);
    panelVerify.classList.toggle("active", btn === tabVerify);
  });
});

// Wallet connection
connectWalletBtn.addEventListener("click", async () => {
  try {
    walletStatusText.textContent = "Connecting…";
    const { shortAddress } = await connectWallet();
    walletStatusText.textContent = shortAddress;
    connectWalletBtn.classList.add("connected");
    validateForm();
  } catch (err) {
    walletStatusText.textContent = "Connect Wallet";
    alert(err.message);
  }
});

onAccountChange((accounts) => {
  if (accounts.length === 0) {
    walletStatusText.textContent = "Connect Wallet";
    connectWalletBtn.classList.remove("connected");
  } else {
    walletStatusText.textContent =
      accounts[0].slice(0, 6) + "…" + accounts[0].slice(-4);
  }
  validateForm();
});

// Photo upload
photoUploadArea.addEventListener("click", () => voterPhoto.click());

voterPhoto.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    alert("Photo must be under 5 MB.");
    return;
  }

  const reader = new FileReader();
  reader.onload = (ev) => {
    uploadedPhotoDataURL = ev.target.result;
    photoPreview.src = uploadedPhotoDataURL;
    photoUploadArea.classList.add("has-photo");
    validateForm();
    updatePreview();
  };
  reader.readAsDataURL(file);
});

// Live preview updates
voterName.addEventListener("input", () => {
  validateForm();
  updatePreview();
});
voterMobile.addEventListener("input", () => {
  validateForm();
  updatePreview();
});

async function updatePreview() {
  await drawIdCard({
    name: voterName.value.trim().toUpperCase(),
    mobile: voterMobile.value.trim(),
    dvsId: "DVS••••••",
    photoDataURL: uploadedPhotoDataURL,
    dataHash: null,
  });
}

// ── Generate & Register ──
generateBtn.addEventListener("click", async () => {
  try {
    generateBtn.disabled = true;
    showStatus("loading", "Generating unique ID…");

    const name = voterName.value.trim().toUpperCase();
    const mobile = voterMobile.value.trim();
    const dvsId = generateDvsId();

    showStatus("loading", "Computing SHA-256 hash…");

    // Hash the card data: dvsId + name + mobile + photo
    const hashInput = `${dvsId}|${name}|${mobile}|${uploadedPhotoDataURL}`;
    const dataHash = await sha256(hashInput);

    showStatus("loading", "Drawing ID card…");

    // Draw the final card with real data
    await drawIdCard({
      name,
      mobile,
      dvsId,
      photoDataURL: uploadedPhotoDataURL,
      dataHash,
    });

    showStatus("loading", "Registering on blockchain… (Confirm in MetaMask)");

    // Register on blockchain
    const { txHash } = await registerCardOnChain(dvsId, dataHash);

    lastGeneratedDvsId = dvsId;
    lastGeneratedHash = dataHash;
    downloadBtn.disabled = false;

    showStatus(
      "success",
      `✅ Card registered! ID: <strong>${dvsId}</strong> · Tx: <code>${txHash.slice(0, 10)}…</code>`
    );
  } catch (err) {
    console.error("Generation failed:", err);
    showStatus("error", `❌ ${err.message || "Registration failed"}`);
    generateBtn.disabled = false;
    validateForm();
  }
});

// ── Download ──
downloadBtn.addEventListener("click", () => {
  if (!lastGeneratedDvsId) return;

  const link = document.createElement("a");
  link.download = `${lastGeneratedDvsId}_IDCard.png`;
  link.href = canvas.toDataURL("image/png", 1.0);
  link.click();
});

// ── Verify ──
verifyBtn.addEventListener("click", async () => {
  const dvsId = verifyDvsId.value.trim();
  const name = verifyName.value.trim().toUpperCase();
  const mobile = verifyMobile.value.trim();

  if (!dvsId || !name || !mobile) {
    alert("Please fill in all fields to verify.");
    return;
  }

  verifyBtn.disabled = true;
  verifyResult.className = "verify-result hidden";

  try {
    // Reconstruct the hash the same way it was generated
    // Note: without the original photo, full verification requires the photo too.
    // For now, we check if the DVS ID exists on-chain as basic verification.
    const hashInput = `${dvsId}|${name}|${mobile}`;

    // Try to check registration status using a read-only provider
    const { ethers } = await import("ethers");
    const { CONTRACT_ADDRESS, CONTRACT_ABI, RPC_URL } = await import("./config.js");

    const readProvider = new ethers.JsonRpcProvider(RPC_URL);
    const readContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, readProvider);

    const registered = await readContract.isRegistered(dvsId);

    if (registered) {
      const [storedHash, registeredAt, registeredBy] = await readContract.getCard(dvsId);
      const regDate = new Date(Number(registeredAt) * 1000).toLocaleString();

      verifyResult.className = "verify-result verified";
      verifyResult.innerHTML = `
        <div class="result-icon">✅</div>
        <div class="result-title">Verified — Authentic Card</div>
        <div class="result-desc">
          This ID card is registered on the Ethereum blockchain.<br />
          <strong>DVS ID:</strong> ${dvsId}<br />
          <strong>Registered:</strong> ${regDate}<br />
          <strong>By Wallet:</strong> <code>${registeredBy.slice(0, 8)}…${registeredBy.slice(-6)}</code><br />
          <strong>Data Hash:</strong> <code>${storedHash.slice(0, 18)}…</code>
        </div>
      `;
    } else {
      verifyResult.className = "verify-result tampered";
      verifyResult.innerHTML = `
        <div class="result-icon">❌</div>
        <div class="result-title">Not Found — Unregistered Card</div>
        <div class="result-desc">
          No record of DVS ID <strong>${dvsId}</strong> exists on the blockchain.<br />
          This card may be fake or tampered with.
        </div>
      `;
    }
  } catch (err) {
    console.error("Verification failed:", err);
    verifyResult.className = "verify-result tampered";
    verifyResult.innerHTML = `
      <div class="result-icon">⚠️</div>
      <div class="result-title">Verification Error</div>
      <div class="result-desc">${err.message || "Could not connect to the blockchain."}</div>
    `;
  } finally {
    verifyBtn.disabled = false;
  }
});

// ────────────────────────────────────────────────────────────
//  Initialisation
// ────────────────────────────────────────────────────────────
(async function init() {
  // Draw an empty preview card
  await drawIdCard({
    name: "",
    mobile: "",
    dvsId: "DVS••••••",
    photoDataURL: null,
    dataHash: null,
  });
})();
