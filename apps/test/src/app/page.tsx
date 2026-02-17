// Server component — validates server + types entry points work in RSC context
import React from 'react';

import { IndexerError } from '@lsp-indexer/react';
import { getServerUrl } from '@lsp-indexer/react/server';
import type { IndexerErrorCategory } from '@lsp-indexer/react/types';

import { ConnectionStatus } from '@/components/connection-status';

function CheckMark({ label, detail }: { label: string; detail: string }): React.ReactNode {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0' }}>
      <span style={{ color: '#16a34a', fontWeight: 600 }}>✓</span>
      <span style={{ fontWeight: 500 }}>{label}</span>
      <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>— {detail}</span>
    </div>
  );
}

function EnvStatus({ name, value }: { name: string; value: string | undefined }): React.ReactNode {
  const isSet = Boolean(value);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0' }}>
      <span style={{ color: isSet ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
        {isSet ? '✓' : '✗'}
      </span>
      <code
        style={{
          fontSize: '0.875rem',
          background: '#f3f4f6',
          padding: '0.125rem 0.375rem',
          borderRadius: '0.25rem',
        }}
      >
        {name}
      </code>
      <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
        {isSet ? 'configured' : 'not set'}
      </span>
    </div>
  );
}

export default function HomePage(): React.ReactNode {
  // Validate type import works (compile-time check)
  const _typeCheck: IndexerErrorCategory = 'CONFIGURATION';

  // Validate main entry import works
  const errorClassName = IndexerError.name;

  // Validate server entry — try to get URL, catch if env vars not set
  let serverUrlStatus: string;
  try {
    const url = getServerUrl();
    serverUrlStatus = `Server URL resolved: ${url}`;
  } catch (error) {
    if (error instanceof IndexerError) {
      serverUrlStatus = `Not configured (${error.code})`;
    } else {
      serverUrlStatus = 'Unknown error checking server URL';
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        LSP Indexer React — Dev Playground
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
        Test app for validating @lsp-indexer/react package entry points, hooks, and integrations.
      </p>

      {/* Package Entry Point Validation */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem' }}>
          Package Status
        </h2>
        <div
          style={{
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            padding: '1rem',
          }}
        >
          <CheckMark
            label="@lsp-indexer/react"
            detail={`imported successfully (${errorClassName})`}
          />
          <CheckMark
            label="@lsp-indexer/react/server"
            detail="imported successfully (getServerUrl)"
          />
          <CheckMark
            label="@lsp-indexer/react/types"
            detail="imported successfully (IndexerErrorCategory)"
          />
        </div>
      </section>

      {/* Environment Status */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem' }}>
          Environment
        </h2>
        <div
          style={{
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            padding: '1rem',
          }}
        >
          <EnvStatus name="NEXT_PUBLIC_INDEXER_URL" value={process.env.NEXT_PUBLIC_INDEXER_URL} />
          <EnvStatus name="INDEXER_URL" value={process.env.INDEXER_URL} />
          <div
            style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #e5e7eb' }}
          >
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Server URL: {serverUrlStatus}
            </span>
          </div>
        </div>
      </section>

      {/* Client-side import validation */}
      <ConnectionStatus />

      {/* Unused variable usage to avoid TS errors */}
      <div style={{ display: 'none' }}>{_typeCheck}</div>
    </div>
  );
}
