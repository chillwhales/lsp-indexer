'use client';

import React, { useEffect, useState } from 'react';

import { IndexerError } from '@lsp-indexer/react';

export function ConnectionStatus(): React.ReactNode {
  const [publicUrl, setPublicUrl] = useState<string | null>(null);

  // Validate main entry import works at runtime in client component
  const errorClassName = IndexerError.name;

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_INDEXER_URL;
    setPublicUrl(url ?? null);
  }, []);

  return (
    <section style={{ marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem' }}>
        Client-Side Status
      </h2>
      <div
        style={{
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          padding: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0' }}>
          <span style={{ color: '#16a34a', fontWeight: 600 }}>✓</span>
          <span style={{ fontWeight: 500 }}>@lsp-indexer/react (client)</span>
          <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            — runtime import working ({errorClassName})
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0' }}>
          <span style={{ color: publicUrl ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
            {publicUrl ? '✓' : '✗'}
          </span>
          <code
            style={{
              fontSize: '0.875rem',
              background: '#f3f4f6',
              padding: '0.125rem 0.375rem',
              borderRadius: '0.25rem',
            }}
          >
            NEXT_PUBLIC_INDEXER_URL
          </code>
          <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            {publicUrl ? `configured (${publicUrl})` : 'not set (client-side)'}
          </span>
        </div>
      </div>
    </section>
  );
}
