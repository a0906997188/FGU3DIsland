export interface Link {
  label: string;
  url: string;
}

export interface Answer {
  q: string;
  a: string;
  links: Link[];
}

export interface Quest {
  id: string;
  title: string;
  demo?: boolean;
  requiresClue?: string;
  lockedHint?: string;
  question: string;
  options: string[];
  answer: number;
  explain: string;
  sources: Link[];
}

export interface Island {
  id: string;
  name: string;
  subtitle: string;
  position: [number, number];
  palette: { grass: string; path: string; accent: string; glow: string };
  sourceUrl: string;
  siteUrl: string;
  courseUrl: string;
  verifiedAt: string;
  summary: string;
  newsKeywords: string[];
  landmark: { type: string; name: string; description: string };
  chief: { name: string; demo?: boolean; greeting: string; answers: Answer[] };
  resident: {
    name: string;
    species: string;
    model: string;
    demo?: boolean;
    line: string;
    givesClue?: { id: string; label: string };
  };
  quest: Quest;
}

export interface Hub {
  id: string;
  name: string;
  subtitle: string;
  position: [number, number];
  color: string;
  intro: string;
}

export interface IslandData {
  college: { name: string; url: string; deptListUrl: string; handbookUrl: string; verifiedAt: string };
  hub: Hub;
  islands: Island[];
}

export interface NewsItem {
  date: string;
  title: string;
  url: string;
}

export interface NewsData {
  source: string;
  fetchedAt: string;
  lastAttempt?: { at: string; ok: boolean; error?: string };
  items: NewsItem[];
}
