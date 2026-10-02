
## Scienstellar

**Science Stellar** is an open, decentralized catalog for scientific papers—initially focused on blockchain and computer science research.

The project uses a Soroban smart contract to register papers, authors, metadata, versions, timestamps, and official content identifiers such as BitTorrent magnet links. The papers themselves are distributed through peer-to-peer networks, while Soroban provides a verifiable public record linking each publication to its registered content sources. Additional storage and distribution protocols, including eMule or IPFS, may be supported in the future.

Users interact with the project through a web-based catalog where they can discover papers, verify their authenticity and version history, and access available download sources without needing to understand the underlying blockchain infrastructure.

Science Stellar also introduces a transparent funding layer. Users can donate to research projects, support authors, or contribute to the maintenance and distribution of open scientific content using the Stellar network.

The goal is to combine science, peer-to-peer distribution, verifiable publication records, and decentralized funding in a single, accessible platform.
=======
# Scienstellar

**Scienstellar** es un catálogo abierto y descentralizado para artículos científicos (centrado inicialmente en blockchain, sistemas distribuidos y criptografía).

Combina el registro inmutable de metadatos, versiones cronológicas e integridad criptográfica en la red **Stellar** mediante un Smart Contract en **Soroban**, junto con la distribución libre de los documentos a través de **BitTorrent** / IPFS y micro-mecenazgo en XLM a los autores.

---

## 🚀 Despliegue en Vivo

* **Instancia Web (Demo):** [http://194.233.76.184:1337](http://194.233.76.184:1337)
* **Red:** Stellar Testnet
* **Soroban Contract ID:** `CAZKCBDXOFE5HUPULIPES6IJTJZYJG3GSIRWJEVP72LJ7MOPT42YJDWD`
* **Transacción en Explorer:** [Stellar.Expert](https://stellar.expert/explorer/testnet/tx/51075843d4ca9f303c3f539a6dd83ed99c3538e71ad3fb5a0a554e8eb4cf4020)
* **Inspección de Contrato:** [Stellar Laboratory](https://lab.stellar.org/r/testnet/contract/CAZKCBDXOFE5HUPULIPES6IJTJZYJG3GSIRWJEVP72LJ7MOPT42YJDWD)

---

## 📂 Estructura del Proyecto

* `contracts/scienstellar/`: Smart contract en Soroban (Rust) con registro de versiones, hashes SHA-256/magnet y donaciones.
* `frontend/`: Aplicación React + Vite + Tailwind con catálogo, visor P2P e integración con Freighter Wallet.

---

## 🛠️ Desarrollo

### Smart Contract
```bash
cd contracts/scienstellar
stellar contract build
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 📄 Licencia
MIT
