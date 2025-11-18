import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clean existing data
  console.log('Cleaning existing data...');
  await prisma.createdAction.deleteMany();
  await prisma.analysisRun.deleteMany();
  await prisma.repoRecord.deleteMany();
  console.log('✓ Cleaned\n');

  // Create sample repositories
  console.log('Creating sample repositories...');

  const repos = await Promise.all([
    prisma.repoRecord.create({
      data: {
        githubFullName: 'facebook/react',
        metaJson: {
          description: 'A declarative, efficient, and flexible JavaScript library for building user interfaces.',
          language: 'JavaScript',
          stars: 220000,
          topics: ['javascript', 'react', 'frontend'],
        },
      },
    }),
    prisma.repoRecord.create({
      data: {
        githubFullName: 'microsoft/typescript',
        metaJson: {
          description: 'TypeScript is a superset of JavaScript that compiles to clean JavaScript output.',
          language: 'TypeScript',
          stars: 95000,
          topics: ['typescript', 'javascript', 'compiler'],
        },
      },
    }),
    prisma.repoRecord.create({
      data: {
        githubFullName: 'vercel/next.js',
        metaJson: {
          description: 'The React Framework for the Web',
          language: 'JavaScript',
          stars: 118000,
          topics: ['react', 'nextjs', 'ssr', 'framework'],
        },
      },
    }),
    prisma.repoRecord.create({
      data: {
        githubFullName: 'nodejs/node',
        metaJson: {
          description: "Node.js JavaScript runtime",
          language: 'JavaScript',
          stars: 102000,
          topics: ['nodejs', 'javascript', 'runtime'],
        },
      },
    }),
    prisma.repoRecord.create({
      data: {
        githubFullName: 'prisma/prisma',
        metaJson: {
          description: 'Next-generation ORM for Node.js & TypeScript',
          language: 'TypeScript',
          stars: 36000,
          topics: ['database', 'orm', 'prisma', 'typescript'],
        },
      },
    }),
  ]);

  console.log(`✓ Created ${repos.length} repositories\n`);

  // Create sample analysis runs
  console.log('Creating sample analysis runs...');

  const analysisRuns = [];

  // React - Completed analysis
  const reactAnalysis = await prisma.analysisRun.create({
    data: {
      repoId: repos[0].id,
      status: 'COMPLETED',
      startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      finishedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
      summaryMarkdown: `# Analysis Summary for facebook/react

The React repository is in excellent health with comprehensive test coverage and active development.

**Health Score:** 95/100

## Improvement Suggestions

### 1. Add more E2E tests for newer features

**Priority:** MEDIUM
**Category:** testing

While unit test coverage is excellent, adding more end-to-end tests for recently added features would further improve reliability.

---

### 2. Update dependency documentation

**Priority:** LOW
**Category:** documentation

Some dependency usage patterns could be better documented for contributors.

---

### 3. Optimize bundle size for production builds

**Priority:** MEDIUM
**Category:** performance

There are opportunities to reduce production bundle size through better tree-shaking and code splitting.

*Analysis completed at ${new Date().toISOString()}*`,
      suggestionsJson: [
        {
          title: 'Add more E2E tests for newer features',
          description: 'While unit test coverage is excellent, adding more end-to-end tests for recently added features would further improve reliability.',
          priority: 'medium',
          category: 'testing',
          issueBody: '## Description\n\nWhile unit test coverage is excellent, adding more end-to-end tests for recently added features would further improve reliability.\n\n## Priority\n\nMedium\n\n## Category\n\ntesting',
        },
        {
          title: 'Update dependency documentation',
          description: 'Some dependency usage patterns could be better documented for contributors.',
          priority: 'low',
          category: 'documentation',
          issueBody: '## Description\n\nSome dependency usage patterns could be better documented for contributors.\n\n## Priority\n\nLow\n\n## Category\n\ndocumentation',
        },
        {
          title: 'Optimize bundle size for production builds',
          description: 'There are opportunities to reduce production bundle size through better tree-shaking and code splitting.',
          priority: 'medium',
          category: 'performance',
          issueBody: '## Description\n\nThere are opportunities to reduce production bundle size through better tree-shaking and code splitting.\n\n## Priority\n\nMedium\n\n## Category\n\nperformance',
        },
      ],
    },
  });

  analysisRuns.push(reactAnalysis);

  // TypeScript - In progress
  const tsAnalysis = await prisma.analysisRun.create({
    data: {
      repoId: repos[1].id,
      status: 'IN_PROGRESS',
      startedAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    },
  });

  analysisRuns.push(tsAnalysis);

  // Next.js - Completed with actions
  const nextAnalysis = await prisma.analysisRun.create({
    data: {
      repoId: repos[2].id,
      status: 'COMPLETED',
      startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      finishedAt: new Date(Date.now() - 23.5 * 60 * 60 * 1000),
      summaryMarkdown: `# Analysis Summary for vercel/next.js

The Next.js repository shows strong development practices with room for improvement in dependency management.

**Health Score:** 88/100

## Improvement Suggestions

### 1. Update outdated dependencies

**Priority:** HIGH
**Category:** dependencies

Several dependencies are 2+ major versions behind. Update to latest stable versions.

---

### 2. Add security audit workflow

**Priority:** HIGH
**Category:** security

Implement automated security scanning in CI/CD pipeline.

---

### 3. Improve error message clarity

**Priority:** MEDIUM
**Category:** code-quality

Some error messages could be more descriptive for better developer experience.

*Analysis completed at ${new Date(Date.now() - 23.5 * 60 * 60 * 1000).toISOString()}*`,
      suggestionsJson: [
        {
          title: 'Update outdated dependencies',
          description: 'Several dependencies are 2+ major versions behind. Update to latest stable versions.',
          priority: 'high',
          category: 'dependencies',
        },
        {
          title: 'Add security audit workflow',
          description: 'Implement automated security scanning in CI/CD pipeline.',
          priority: 'high',
          category: 'security',
        },
        {
          title: 'Improve error message clarity',
          description: 'Some error messages could be more descriptive for better developer experience.',
          priority: 'medium',
          category: 'code-quality',
        },
      ],
    },
  });

  analysisRuns.push(nextAnalysis);

  // Update lastAnalyzedAt for analyzed repos
  await prisma.repoRecord.update({
    where: { id: repos[0].id },
    data: { lastAnalyzedAt: reactAnalysis.finishedAt },
  });

  await prisma.repoRecord.update({
    where: { id: repos[2].id },
    data: { lastAnalyzedAt: nextAnalysis.finishedAt },
  });

  console.log(`✓ Created ${analysisRuns.length} analysis runs\n`);

  // Create sample actions for Next.js analysis
  console.log('Creating sample actions...');

  const action = await prisma.createdAction.create({
    data: {
      runId: nextAnalysis.id,
      type: 'ISSUE',
      targetUrl: 'https://github.com/vercel/next.js/issues/12345',
      payloadJson: {
        title: 'Update outdated dependencies',
        body: 'Several dependencies are 2+ major versions behind.',
        labels: ['automated', 'improvement', 'dependencies'],
      },
    },
  });

  console.log('✓ Created 1 action\n');

  console.log('✅ Seed completed successfully!\n');
  console.log('Summary:');
  console.log(`  Repositories: ${repos.length}`);
  console.log(`  Analysis runs: ${analysisRuns.length}`);
  console.log(`  Actions: 1`);
  console.log('');
  console.log('Demo credentials:');
  console.log('  No authentication required for this demo');
  console.log('');
  console.log('Try it out:');
  console.log('  1. Start the backend: npm run dev');
  console.log('  2. Visit http://localhost:3001/api/repos');
  console.log('  3. Check analysis: http://localhost:3001/api/analysis/' + reactAnalysis.id);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
