export interface RepoData {
  fullName: string;
  description: string | null;
  openIssuesCount: number;
  forksCount: number;
  stargazersCount: number;
  language: string | null;
  languages: Record<string, number>;
  lastCommitDate: string | null;
  hasTests: boolean;
  hasCICD: boolean;
  defaultBranch: string;
  topics: string[];
}

export interface ImprovementSuggestion {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  issueBody?: string;
}

export interface AnalysisResult {
  summary: string;
  suggestions: ImprovementSuggestion[];
  healthScore: number;
}

export interface JobData {
  repoId: string;
  githubFullName: string;
}
