import { isConnected, getAddress } from "@stellar/freighter-api";

export async function connectWallet(): Promise<string | null> {
  try {
    const connected = await isConnected();
    if (!connected) {
      alert("Freighter Wallet no detectada. Abre o desbloquea tu extensión.");
      return null;
    }
    const res = await getAddress();
    return res.address;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export const MOCK_PAPERS = [
  {
    id: 1,
    authorAddress: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    authorName: "Dr. Elena Rostova",
    title: "Zero-Knowledge Rollups on Stellar Consensus Protocol",
    abstractText: "This paper analyzes the integration of recursive SNARK verification algorithms into SCP quorums to achieve sub-second finality while retaining high throughput.",
    category: "Blockchain",
    totalDonations: "154.50",
    versions: [
      {
        version: 1,
        timestamp: 1715000000,
        magnetLink: "magnet:?xt=urn:btih:4a2f8c12e56b89d44c01289dfc9103a89047b192&dn=zk-stellar.pdf",
        contentHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        changelog: "Initial draft release",
      }
    ],
  },
  {
    id: 2,
    authorAddress: "GBBM6WDFUIPVIWIIOWTV6KVEXXTTOAOWET5CHWODQKEFD2UDS3TRUDVV",
    authorName: "Marcus Vance",
    title: "Fault-Tolerant Distributed Peer Discovery with DHT and Kad Hybridization",
    abstractText: "We propose a hybrid overlay architecture merging Kademlia with Gossip protocols to enhance resilient peer routing during adversarial eclipse attacks.",
    category: "Distributed Systems",
    totalDonations: "80.00",
    versions: [
      {
        version: 1,
        timestamp: 1720000000,
        magnetLink: "magnet:?xt=urn:btih:11aa22bb33cc44dd55ee66ff77aa88bb99cc00dd&dn=hybrid-kad.pdf",
        contentHash: "c0535e4be2b79ffd93291305436bf889314e4a3faec05ecffcbb7ff310919046",
        changelog: "Conference submission version",
      }
    ],
  }
];
