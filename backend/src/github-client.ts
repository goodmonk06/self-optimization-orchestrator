import { Octokit } from '@octokit/rest';
import { config } from './config';
import { RepoData } from './types';

export class GitHubClient {
  private octokit: Octokit;

  constructor() {
    this.octokit = new Octokit({
      auth: config.github.token,
    });
  }

  /**
   * Fetch all repositories for the configured user or organization
   */
  async fetchAllRepos(): Promise<Array<{ fullName: string; description: string | null }>> {
    try {
      const repos: Array<{ fullName: string; description: string | null }> = [];
      let page = 1;
      const perPage = 100;

      while (true) {
        const response = await this.octokit.repos.listForAuthenticatedUser({
          per_page: perPage,
          page,
          sort: 'updated',
          affiliation: 'owner',
        });

        if (response.data.length === 0) break;

        repos.push(
          ...response.data.map((repo) => ({
            fullName: repo.full_name,
            description: repo.description,
          }))
        );

        if (response.data.length < perPage) break;
        page++;
      }

      return repos;
    } catch (error) {
      console.error('Error fetching repos:', error);
      throw error;
    }
  }

  /**
   * Fetch detailed repository data for analysis
   */
  async fetchRepoData(fullName: string): Promise<RepoData> {
    const [owner, repo] = fullName.split('/');

    try {
      // Get repository info
      const repoInfo = await this.octokit.repos.get({ owner, repo });

      // Get languages
      const languages = await this.octokit.repos.listLanguages({ owner, repo });

      // Get latest commit
      let lastCommitDate: string | null = null;
      try {
        const commits = await this.octokit.repos.listCommits({
          owner,
          repo,
          per_page: 1,
        });
        if (commits.data.length > 0) {
          lastCommitDate = commits.data[0].commit.committer?.date || null;
        }
      } catch (error) {
        console.warn(`Could not fetch commits for ${fullName}`);
      }

      // Check for test files
      const hasTests = await this.checkForTests(owner, repo);

      // Check for CI/CD
      const hasCICD = await this.checkForCICD(owner, repo);

      return {
        fullName,
        description: repoInfo.data.description,
        openIssuesCount: repoInfo.data.open_issues_count,
        forksCount: repoInfo.data.forks_count,
        stargazersCount: repoInfo.data.stargazers_count,
        language: repoInfo.data.language,
        languages: languages.data,
        lastCommitDate,
        hasTests,
        hasCICD,
        defaultBranch: repoInfo.data.default_branch,
        topics: repoInfo.data.topics || [],
      };
    } catch (error) {
      console.error(`Error fetching repo data for ${fullName}:`, error);
      throw error;
    }
  }

  /**
   * Check if repository has test files
   */
  private async checkForTests(owner: string, repo: string): Promise<boolean> {
    try {
      const testPatterns = ['test', 'spec', '__tests__'];

      for (const pattern of testPatterns) {
        const searchResult = await this.octokit.search.code({
          q: `${pattern} in:path repo:${owner}/${repo}`,
          per_page: 1,
        });

        if (searchResult.data.total_count > 0) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.warn(`Could not search for tests in ${owner}/${repo}`);
      return false;
    }
  }

  /**
   * Check if repository has CI/CD configuration
   */
  private async checkForCICD(owner: string, repo: string): Promise<boolean> {
    try {
      const cicdPaths = [
        '.github/workflows',
        '.gitlab-ci.yml',
        '.circleci/config.yml',
        'azure-pipelines.yml',
        'Jenkinsfile',
      ];

      for (const path of cicdPaths) {
        try {
          await this.octokit.repos.getContent({
            owner,
            repo,
            path,
          });
          return true;
        } catch (error) {
          // Path doesn't exist, continue
        }
      }

      return false;
    } catch (error) {
      console.warn(`Could not check for CI/CD in ${owner}/${repo}`);
      return false;
    }
  }

  /**
   * Create a GitHub issue
   */
  async createIssue(
    fullName: string,
    title: string,
    body: string,
    labels?: string[]
  ): Promise<string> {
    const [owner, repo] = fullName.split('/');

    try {
      const response = await this.octokit.issues.create({
        owner,
        repo,
        title,
        body,
        labels: labels || ['automated', 'improvement'],
      });

      return response.data.html_url;
    } catch (error) {
      console.error(`Error creating issue for ${fullName}:`, error);
      throw error;
    }
  }
}
