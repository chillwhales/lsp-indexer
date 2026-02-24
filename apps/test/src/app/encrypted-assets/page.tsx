'use client';

import { Infinity, List } from 'lucide-react';
import React, { useState } from 'react';

import {
  useEncryptedAssets as useEncryptedAssetsNext,
  useInfiniteEncryptedAssets as useInfiniteEncryptedAssetsNext,
} from '@lsp-indexer/next';
import {
  useEncryptedAssets as useEncryptedAssetsReact,
  useInfiniteEncryptedAssets as useInfiniteEncryptedAssetsReact,
} from '@lsp-indexer/react';
import type {
  EncryptedAssetFilter,
  EncryptedAssetInclude,
  EncryptedAssetSort,
  EncryptedAssetSortField,
  SortDirection,
  SortNulls,
} from '@lsp-indexer/types';

import { EncryptedAssetCard } from '@/components/encrypted-asset-card';
import type { FilterFieldConfig, HookMode, SortOption } from '@/components/playground';
import {
  buildNestedInclude,
  ENCRYPTED_ASSET_CHUNKS_INCLUDE_FIELDS,
  ENCRYPTED_ASSET_ENCRYPTION_INCLUDE_FIELDS,
  ENCRYPTED_ASSET_FILE_INCLUDE_FIELDS,
  ENCRYPTED_ASSET_INCLUDE_FIELDS,
  FilterFieldsRow,
  IncludeToggles,
  PlaygroundPageLayout,
  PROFILE_INCLUDE_FIELDS,
  ResultsList,
  SortControls,
  SubIncludeSection,
  useFilterFields,
  useIncludeToggles,
  useSubInclude,
} from '@/components/playground';

// ---------------------------------------------------------------------------
// Domain config — 8 filter fields, 5 sort options
// ---------------------------------------------------------------------------

const ALL_FILTERS: FilterFieldConfig[] = [
  {
    key: 'address',
    label: 'Address',
    placeholder: '0x... (UP address)',
    mono: true,
    width: 'w-80',
  },
  {
    key: 'universalProfileName',
    label: 'Profile Name',
    placeholder: 'Search profile name...',
    width: 'w-80',
  },
  {
    key: 'contentId',
    label: 'Content ID',
    placeholder: 'Content identifier...',
    mono: true,
    width: 'w-80',
  },
  {
    key: 'revision',
    label: 'Revision',
    placeholder: 'e.g. 1',
    mono: true,
    width: 'w-28',
  },
  {
    key: 'encryptionMethod',
    label: 'Encryption Method',
    placeholder: 'e.g. Lit Protocol',
    width: 'w-48',
  },
  {
    key: 'fileType',
    label: 'File Type',
    placeholder: 'e.g. image/png',
    mono: true,
    width: 'w-40',
  },
  {
    key: 'fileSize',
    label: 'Min File Size',
    placeholder: 'bytes (e.g. 1024)',
    mono: true,
    width: 'w-32',
  },
  {
    key: 'timestamp',
    label: 'From Timestamp',
    placeholder: 'ISO or unix (e.g. 2024-01-01)',
    width: 'w-80',
  },
];

/** Filter groups rendered as separate rows */
const ROW1_FILTERS = ALL_FILTERS.filter(
  (f) => f.key === 'address' || f.key === 'universalProfileName' || f.key === 'contentId',
);
const ROW2_FILTERS = ALL_FILTERS.filter(
  (f) => f.key === 'revision' || f.key === 'encryptionMethod' || f.key === 'fileType',
);
const ROW3_FILTERS = ALL_FILTERS.filter((f) => f.key === 'fileSize' || f.key === 'timestamp');

const SORT_OPTIONS: SortOption[] = [
  { value: 'timestamp', label: 'Timestamp' },
  { value: 'address', label: 'Address' },
  { value: 'contentId', label: 'Content ID' },
  { value: 'revision', label: 'Revision' },
  { value: 'arrayIndex', label: 'Array Index' },
];

// ---------------------------------------------------------------------------
// Hook resolution by mode
// ---------------------------------------------------------------------------

type EncryptedAssetHooks = {
  useEncryptedAssets: typeof useEncryptedAssetsReact;
  useInfiniteEncryptedAssets: typeof useInfiniteEncryptedAssetsReact;
};

function useEncryptedAssetHooks(mode: HookMode): EncryptedAssetHooks {
  if (mode === 'server') {
    return {
      useEncryptedAssets: useEncryptedAssetsNext,
      useInfiniteEncryptedAssets: useInfiniteEncryptedAssetsNext,
    };
  }
  return {
    useEncryptedAssets: useEncryptedAssetsReact,
    useInfiniteEncryptedAssets: useInfiniteEncryptedAssetsReact,
  };
}

// ---------------------------------------------------------------------------
// Build filter from debounced values — numeric conversion for revision/fileSize
// ---------------------------------------------------------------------------

function buildFilter(debouncedValues: Record<string, string>): EncryptedAssetFilter | undefined {
  const f: EncryptedAssetFilter = {};
  if (debouncedValues.address) f.address = debouncedValues.address;
  if (debouncedValues.universalProfileName)
    f.universalProfileName = debouncedValues.universalProfileName;
  if (debouncedValues.contentId) f.contentId = debouncedValues.contentId;
  if (debouncedValues.revision) {
    const num = Number(debouncedValues.revision);
    if (!Number.isNaN(num)) f.revision = num;
  }
  if (debouncedValues.encryptionMethod) f.encryptionMethod = debouncedValues.encryptionMethod;
  if (debouncedValues.fileType) f.fileType = debouncedValues.fileType;
  if (debouncedValues.fileSize) {
    const num = Number(debouncedValues.fileSize);
    if (!Number.isNaN(num)) f.fileSize = num;
  }
  if (debouncedValues.timestamp) f.timestamp = debouncedValues.timestamp;
  return Object.keys(f).length > 0 ? f : undefined;
}

// ---------------------------------------------------------------------------
// Shared list state for list/infinite tabs
// ---------------------------------------------------------------------------

function useListState() {
  const { values, debouncedValues, setFieldValue } = useFilterFields(ALL_FILTERS);
  const [sortField, setSortField] = useState<EncryptedAssetSortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [sortNulls, setSortNulls] = useState<SortNulls | undefined>(undefined);
  const { values: includeValues, toggle: toggleInclude } = useIncludeToggles(
    ENCRYPTED_ASSET_INCLUDE_FIELDS,
  );
  const encryption = useSubInclude(ENCRYPTED_ASSET_ENCRYPTION_INCLUDE_FIELDS);
  const file = useSubInclude(ENCRYPTED_ASSET_FILE_INCLUDE_FIELDS);
  const chunks = useSubInclude(ENCRYPTED_ASSET_CHUNKS_INCLUDE_FIELDS);
  const universalProfile = useSubInclude(PROFILE_INCLUDE_FIELDS);

  const filter = buildFilter(debouncedValues);
  const sort: EncryptedAssetSort = {
    field: sortField,
    direction: sortDirection,
    nulls: sortNulls,
  };
  const hasActiveFilter = Object.values(debouncedValues).some(Boolean);

  // Build include with sub-include handling for encryption, file, chunks:
  // Each sub-include value is either undefined (excluded), or an object with per-field toggles
  const include = buildNestedInclude(includeValues, {
    encryption: encryption.value,
    file: file.value,
    chunks: chunks.value,
    universalProfile: universalProfile.value,
  }) as EncryptedAssetInclude | undefined;

  return {
    values,
    setFieldValue,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    sortNulls,
    setSortNulls,
    filter,
    sort,
    hasActiveFilter,
    includeValues,
    toggleInclude,
    include,
    encryption,
    file,
    chunks,
    universalProfile,
  };
}

// ---------------------------------------------------------------------------
// Include sections (shared between tabs)
// ---------------------------------------------------------------------------

function IncludeSections({
  includeValues,
  toggleInclude,
  encryption,
  file,
  chunks,
  universalProfile,
}: ReturnType<typeof useListState>): React.ReactNode {
  return (
    <>
      <IncludeToggles
        configs={ENCRYPTED_ASSET_INCLUDE_FIELDS}
        values={includeValues}
        onToggle={toggleInclude}
      />
      <SubIncludeSection
        label="Encryption"
        subtitle="Encryption sub-fields"
        configs={ENCRYPTED_ASSET_ENCRYPTION_INCLUDE_FIELDS}
        state={encryption}
      />
      <SubIncludeSection
        label="File"
        subtitle="File sub-fields (name always included)"
        configs={ENCRYPTED_ASSET_FILE_INCLUDE_FIELDS}
        state={file}
      />
      <SubIncludeSection
        label="Chunks"
        subtitle="Chunks sub-fields"
        configs={ENCRYPTED_ASSET_CHUNKS_INCLUDE_FIELDS}
        state={chunks}
      />
      <SubIncludeSection
        label="Universal Profile"
        subtitle="Profile sub-fields"
        configs={PROFILE_INCLUDE_FIELDS}
        state={universalProfile}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Tab 1: List — paginated list of encrypted assets
// ---------------------------------------------------------------------------

function ListTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useEncryptedAssets } = useEncryptedAssetHooks(mode);
  const state = useListState();
  const [limit, setLimit] = useState(10);

  const { encryptedAssets, totalCount, isLoading, error, isFetching } = useEncryptedAssets({
    filter: state.filter,
    sort: state.sort,
    limit,
    include: state.include,
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <FilterFieldsRow
          configs={ROW1_FILTERS}
          values={state.values}
          onFieldChange={state.setFieldValue}
        />
        <FilterFieldsRow
          configs={ROW2_FILTERS}
          values={state.values}
          onFieldChange={state.setFieldValue}
        />
        <FilterFieldsRow
          configs={ROW3_FILTERS}
          values={state.values}
          onFieldChange={state.setFieldValue}
        />
      </div>
      <SortControls
        options={SORT_OPTIONS}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        onSortFieldChange={(v) => state.setSortField(v as EncryptedAssetSortField)}
        onSortDirectionChange={(v) => state.setSortDirection(v as SortDirection)}
        sortNulls={state.sortNulls ?? ''}
        onSortNullsChange={(v) =>
          state.setSortNulls(v === 'default' ? undefined : (v as SortNulls))
        }
        limit={limit}
        onLimitChange={setLimit}
      />
      <IncludeSections {...state} />
      <ResultsList
        items={encryptedAssets}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(ea) => <EncryptedAssetCard encryptedAsset={ea} />}
        getKey={(ea) => `${ea.address}-${ea.contentId ?? ''}-${ea.revision ?? ''}`}
        label="encrypted assets"
        totalCount={totalCount}
        hasActiveFilter={state.hasActiveFilter}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2: Infinite — infinite scroll encrypted assets
// ---------------------------------------------------------------------------

function InfiniteTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useInfiniteEncryptedAssets } = useEncryptedAssetHooks(mode);
  const state = useListState();

  const {
    encryptedAssets,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    isFetching,
  } = useInfiniteEncryptedAssets({
    filter: state.filter,
    sort: state.sort,
    pageSize: 10,
    include: state.include,
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <FilterFieldsRow
          configs={ROW1_FILTERS}
          values={state.values}
          onFieldChange={state.setFieldValue}
        />
        <FilterFieldsRow
          configs={ROW2_FILTERS}
          values={state.values}
          onFieldChange={state.setFieldValue}
        />
        <FilterFieldsRow
          configs={ROW3_FILTERS}
          values={state.values}
          onFieldChange={state.setFieldValue}
        />
      </div>
      <SortControls
        options={SORT_OPTIONS}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        onSortFieldChange={(v) => state.setSortField(v as EncryptedAssetSortField)}
        onSortDirectionChange={(v) => state.setSortDirection(v as SortDirection)}
        sortNulls={state.sortNulls ?? ''}
        onSortNullsChange={(v) =>
          state.setSortNulls(v === 'default' ? undefined : (v as SortNulls))
        }
      />
      <IncludeSections {...state} />
      <ResultsList
        items={encryptedAssets}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(ea) => <EncryptedAssetCard encryptedAsset={ea} />}
        getKey={(ea) => `${ea.address}-${ea.contentId ?? ''}-${ea.revision ?? ''}`}
        label="encrypted assets"
        hasActiveFilter={state.hasActiveFilter}
        infinite={{ hasNextPage, fetchNextPage, isFetchingNextPage }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function EncryptedAssetsPage(): React.ReactNode {
  return (
    <PlaygroundPageLayout
      title="Encrypted Assets"
      description={
        <>
          Exercise <code className="text-xs bg-muted px-1 py-0.5 rounded">useEncryptedAssets</code>{' '}
          and{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useInfiniteEncryptedAssets</code>{' '}
          hooks against the{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">lsp29_encrypted_asset</code> table
          via Hasura (QUERY-08).
        </>
      }
      tabs={[
        {
          value: 'list',
          label: 'List',
          icon: <List className="size-4" />,
          render: (mode) => <ListTab mode={mode} />,
        },
        {
          value: 'infinite',
          label: 'Infinite',
          icon: <Infinity className="size-4" />,
          render: (mode) => <InfiniteTab mode={mode} />,
        },
      ]}
    />
  );
}
