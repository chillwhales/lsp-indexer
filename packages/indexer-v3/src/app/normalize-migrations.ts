import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const migrationsDirectory = fileURLToPath(new URL('../../drizzle', import.meta.url));

/** Keep generated SQL schema-relative so the same migration can be applied to every chain. */
async function normalizeMigrations(checkOnly: boolean): Promise<void> {
  const files = (await readdir(migrationsDirectory)).filter((file) => file.endsWith('.sql')).sort();
  const unnormalized: string[] = [];

  for (const file of files) {
    const url = new URL(`../../drizzle/${file}`, import.meta.url);
    const source = await readFile(url, 'utf8');
    const normalized = source
      .replace(/^CREATE TYPE (?:"public"\.)?.*?;--> statement-breakpoint\r?\n?/gm, '')
      .replaceAll('"public".', '');
    if (source === normalized) continue;

    if (checkOnly) {
      unnormalized.push(file);
    } else {
      await writeFile(url, normalized);
    }
  }

  if (unnormalized.length > 0) {
    throw new Error(
      `Drizzle migrations contain public-schema qualifiers: ${unnormalized.join(', ')}. Run db:generate.`,
    );
  }
}

await normalizeMigrations(process.argv.includes('--check'));
