import { Octokit } from "@octokit/rest";

export type Repository = {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  html_url: string;
  description: string | null;
  private: boolean;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  git_url: string;
  clone_url: string;
  language: string | null;
  default_branch: string;
};

export type PullRequest = {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  user: {
    login: string;
    avatar_url: string;
  };
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
    sha: string;
  };
};

export class GitHubClient {
  private octokit: Octokit;

  constructor(accessToken: string) {
    this.octokit = new Octokit({
      auth: accessToken,
    });
  }

  async getUserRepositories(): Promise<Repository[]> {
    const { data } = await this.octokit.repos.listForAuthenticatedUser({
      sort: "updated",
      per_page: 100,
    });

    return data as Repository[];
  }

  async getRepository(owner: string, repo: string): Promise<Repository> {
    const { data } = await this.octokit.repos.get({
      owner,
      repo,
    });

    return data as Repository;
  }

  async getRepositoryPullRequests(
    owner: string,
    repo: string
  ): Promise<PullRequest[]> {
    const { data } = await this.octokit.pulls.list({
      owner,
      repo,
      state: "all",
      per_page: 100,
    });

    return data as PullRequest[];
  }

  async getPullRequest(
    owner: string,
    repo: string,
    pull_number: number
  ): Promise<PullRequest> {
    const { data } = await this.octokit.pulls.get({
      owner,
      repo,
      pull_number,
    });

    return data as PullRequest;
  }

  async getPullRequestFiles(
    owner: string,
    repo: string,
    pull_number: number
  ): Promise<{ filename: string; patch?: string; changes: number }[]> {
    const { data } = await this.octokit.pulls.listFiles({
      owner,
      repo,
      pull_number,
    });

    return data;
  }
} 