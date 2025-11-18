/**
 * Analyzer Adapter Interface
 * Allows pluggable LLM providers for repository analysis
 */

import { RepoData, AnalysisResult } from '../../types';

export interface IAnalyzerAdapter {
  /**
   * Analyze a repository and return suggestions
   */
  analyze(repoData: RepoData, promptTemplate?: string): Promise<AnalysisResult>;

  /**
   * Get adapter name
   */
  getName(): string;

  /**
   * Get estimated cost for an analysis (in USD)
   */
  estimateCost?(tokens: number): number;
}

/**
 * OpenAI Analyzer Adapter (existing implementation)
 */
export class OpenAIAnalyzerAdapter implements IAnalyzerAdapter {
  constructor(private apiKey: string, private model: string = 'gpt-4-turbo-preview') {}

  async analyze(repoData: RepoData, promptTemplate?: string): Promise<AnalysisResult> {
    // Implementation moved from llm-service.ts
    // This is a placeholder showing the structure
    throw new Error('Implement OpenAI analysis logic here');
  }

  getName(): string {
    return 'openai';
  }

  estimateCost(tokens: number): number {
    // GPT-4 Turbo pricing (approximate)
    const inputCost = (tokens * 0.01) / 1000;
    const outputCost = (tokens * 0.03) / 1000;
    return inputCost + outputCost;
  }
}

/**
 * Anthropic Claude Analyzer Adapter (future implementation)
 */
export class ClaudeAnalyzerAdapter implements IAnalyzerAdapter {
  constructor(private apiKey: string, private model: string = 'claude-3-opus-20240229') {}

  async analyze(repoData: RepoData, promptTemplate?: string): Promise<AnalysisResult> {
    // Future implementation for Anthropic Claude
    throw new Error('Claude analyzer not yet implemented');
  }

  getName(): string {
    return 'claude';
  }

  estimateCost(tokens: number): number {
    // Claude pricing (approximate)
    const inputCost = (tokens * 0.015) / 1000;
    const outputCost = (tokens * 0.075) / 1000;
    return inputCost + outputCost;
  }
}

/**
 * Mock Analyzer Adapter (for testing)
 */
export class MockAnalyzerAdapter implements IAnalyzerAdapter {
  async analyze(repoData: RepoData): Promise<AnalysisResult> {
    return {
      summary: `Mock analysis for ${repoData.fullName}`,
      healthScore: Math.floor(Math.random() * 40) + 60, // 60-100
      suggestions: [
        {
          title: 'Add more tests',
          description: 'Increase test coverage',
          priority: 'medium',
          category: 'testing',
          issueBody: '## Add more tests\n\nIncrease test coverage',
        },
        {
          title: 'Update dependencies',
          description: 'Some dependencies are outdated',
          priority: 'high',
          category: 'dependencies',
          issueBody: '## Update dependencies\n\nSome dependencies are outdated',
        },
        {
          title: 'Improve documentation',
          description: 'Add more inline documentation',
          priority: 'low',
          category: 'documentation',
          issueBody: '## Improve documentation\n\nAdd more inline documentation',
        },
      ],
    };
  }

  getName(): string {
    return 'mock';
  }

  estimateCost(): number {
    return 0;
  }
}
