import Link from 'next/link';

interface NavLink {
  href: string;
  label: string;
  available: boolean;
}

const navLinks: NavLink[] = [
  { href: '/', label: 'Home', available: true },
  { href: '/profiles', label: 'Profiles', available: false },
  { href: '/assets', label: 'Digital Assets', available: false },
  { href: '/nfts', label: 'NFTs', available: false },
  { href: '/owned', label: 'Owned Assets', available: false },
  { href: '/follows', label: 'Follows', available: false },
  { href: '/creators', label: 'Creators', available: false },
  { href: '/encrypted', label: 'Encrypted Assets', available: false },
  { href: '/events', label: 'Events', available: false },
  { href: '/stats', label: 'Stats', available: false },
];

export function Nav(): React.ReactNode {
  return (
    <nav
      style={{
        width: '220px',
        borderRight: '1px solid #e5e7eb',
        padding: '1rem',
        minHeight: '100vh',
      }}
    >
      <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', marginBottom: '1rem' }}>
        Domain Playgrounds
      </h2>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {navLinks.map((link) => (
          <li key={link.href} style={{ marginBottom: '0.25rem' }}>
            {link.available ? (
              <Link
                href={link.href}
                style={{
                  display: 'block',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  color: '#1f2937',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                }}
              >
                {link.label}
              </Link>
            ) : (
              <span
                style={{
                  display: 'block',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  color: '#9ca3af',
                  fontSize: '0.875rem',
                }}
              >
                {link.label}{' '}
                <span style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>Coming Soon</span>
              </span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
