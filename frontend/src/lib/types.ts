export type LogEntry = {
  id: number;
  title: string;
  description: string;
  tags: string;
  created_at: string;
};

export type GitHubCommit = {
  sha: string;
  message: string;
  repo: string;
  url: string;
  date: string;
};

export type GitHubPR = {
  number: number;
  title: string;
  repo: string;
  url: string;
  state: "open" | "merged";
  date: string;
};
