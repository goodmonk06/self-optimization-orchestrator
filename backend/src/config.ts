import dotenv from 'dotenv';

dotenv.config();

export const config = {
  database: {
    url: process.env.DATABASE_URL || '',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  github: {
    token: process.env.GITHUB_TOKEN || '',
    orgOrUser: process.env.GITHUB_ORG_OR_USER || '',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  analysis: {
    autoCreateIssues: process.env.AUTO_CREATE_ISSUES === 'true',
    analysisCron: process.env.ANALYSIS_CRON || '0 0 * * *',
  },
};

export function validateConfig() {
  const required = [
    { key: 'GITHUB_TOKEN', value: config.github.token },
    { key: 'GITHUB_ORG_OR_USER', value: config.github.orgOrUser },
    { key: 'OPENAI_API_KEY', value: config.openai.apiKey },
    { key: 'DATABASE_URL', value: config.database.url },
  ];

  const missing = required.filter(({ value }) => !value).map(({ key }) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}
