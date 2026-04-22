export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="animate-fade-in px-6 py-6 w-full">
      <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
        {title}
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>
        This section is coming soon.
      </p>

      <div className="rounded-2xl p-12 flex items-center justify-center"
        style={{
          background: 'var(--color-bg-card)',
          border: '1px dashed var(--color-border)',
        }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(99, 102, 241, 0.1)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-light)"
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18" />
              <path d="M9 21V9" />
            </svg>
          </div>
          <p className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
            Under Construction
          </p>
          <p className="text-sm mt-1 max-w-xs" style={{ color: 'var(--color-text-dim)' }}>
            We're building something great. This feature will be available in the next update.
          </p>
        </div>
      </div>
    </div>
  );
}
