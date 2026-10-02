export interface PaperVersion {
  version: number;
  timestamp: number;
  magnetLink: string;
  contentHash: string;
  changelog: string;
}

export interface Paper {
  id: number;
  authorAddress: string;
  authorName: string;
  title: string;
  abstractText: string;
  category: string;
  versions: PaperVersion[];
  totalDonations: string;
}
