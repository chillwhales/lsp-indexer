import { defineConfig } from 'drizzle-kit';

const config = defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_ADMIN_URL ?? 'postgresql://localhost/lsp_indexer_v3',
  },
  strict: true,
  verbose: true,
});

export default config;
