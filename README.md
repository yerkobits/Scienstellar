# 🧪 Scienstellar

> The Decentralized Scientific Knowledge Catalog powered by Stellar.

Scienstellar is a Web3 decentralized platform designed to catalogue, store, and protect scientific research papers. It replaces legacy academic publishing models with a transparent, censorship-resistant, and creator-first ecosystem built on top of the **Stellar Network** and **IPFS/Stellar Storage**.

---

## 🌟 Core Vision & Value Proposition

Traditional academic publishing (such as *Nature* or *Science*) relies on closed paywalls, expensive processing fees, and centralized editorial control. Conversely, open preprint servers (like *arXiv*) lack native economic incentives and built-in intellectual property safeguards.

**Scienstellar solves this by offering:**
* **True Ownership & Direct Monetization:** Authors publish directly via their Stellar wallet. Readers make micro-donations or pay-per-access that go 100% to the author without middlemen.
* **Web3 DOI (Digital Object Identifier):** Every paper registered on-chain receives a cryptographic identifier leveraging blockchain's core properties: **traceability, immutability, and precise timestamping**—crucial for intellectual property and establishing "first-to-publish" priority.
* **Incentivized Decentralized Storage:** Files are stored as encrypted/obfuscated ZIP packages across a distributed node network. Nodes are rewarded in real-time based on actual *uptime* and proof-of-availability when donations occur.
* **Topological Peer Review:** Peer review and academic lineage are established natively by linking new papers as subordinated references to existing on-chain papers (both in the smart contract and inside the document content).

---

## ⚙️ Architecture & Roadmap

### 1. Storage Layer
* **Current (Testnet Phase):** Uses IPFS infrastructure via **Pinata** (`https://app.pinata.cloud/`) to handle file distribution and retrieve CIDs.
* **Future (Mainnet Phase):** Migration to **Stellar Storage** (a dedicated L2/sidechain designed for linked storage on Stellar), introducing a one-time publisher fee based on file size and real-time node streaming rewards.

### 2. Smart Contracts (Soroban / Rust)
* Built on Stellar's smart contract platform (**Soroban**).
* Handles paper registration, tokenized access rights, metadata binding, and automated fund routing.

### 3. Frontend (React / Vite)
* Modern decentralized application (dApp) interface.
* Features automatic wallet synchronization (e.g., Freighter), real-time contract state polling, and race-condition handling for seamless user interaction.

---

## 🚀 Getting Started (Development / Testnet)

If you are running the project locally or deploying to a VPS:

### Prerequisites
* Node.js & npm
* PM2 (for production server management)
* A Stellar-compatible wallet (like **Freighter**) configured for **Testnet**.

### Installation & Run

```bash
# Clone the repository
git clone https://github.com/yerkobits/Scienstellar.git
cd Scienstellar

# Install dependencies
npm install

# Build the project
npm run build

# Serve locally or with PM2 (Vite preview)
npx vite preview --host 0.0.0.0 --port 1337
```

---

## 🛡️ License & Contributing

Scienstellar is an open-source initiative aimed at democratizing science through Web3. Contributions, suggestions, and node operator interest are welcome!

---
*Built with Rust (Soroban) & React (Vite).*
