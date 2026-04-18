export type Citation = {
  title: string;
  source: string;
  url: string;
  note: string;
};

/**
 * Maps attack_class strings to an array of citations.
 * Used by buildDashboardSnapshot to attach research cards to each attack.
 */
export type CitationLookup = Record<string, Citation[]>;
