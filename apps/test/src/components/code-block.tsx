import { bundledLanguages, codeToHtml } from 'shiki';

import { CopyButton } from '@/components/copy-button';

interface CodeBlockProps {
  code: string;
  lang: string;
}

/** Map common aliases to Shiki-supported languages. */
const langAliases: Record<string, string> = {
  env: 'bash',
  yml: 'yaml',
  txt: 'text',
};

/** Server component — highlights code with Shiki and renders with a copy button. */
export async function CodeBlock({ code, lang }: CodeBlockProps): Promise<React.ReactNode> {
  const resolved = langAliases[lang] ?? lang;
  const safeLang = resolved in bundledLanguages ? resolved : 'text';

  const html = await codeToHtml(code, {
    lang: safeLang,
    themes: {
      light: 'github-light-default',
      dark: 'github-dark-default',
    },
    defaultColor: false,
    cssVariablePrefix: '--shiki-',
  });

  return (
    <div className="not-prose my-4 overflow-hidden rounded-lg border border-border">
      <div className="flex items-center justify-end border-b border-border px-3 py-1">
        <CopyButton text={code} />
      </div>
      <div
        className="overflow-x-auto text-sm [&_pre]:px-4 [&_pre]:py-3 [&_pre]:leading-relaxed"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
