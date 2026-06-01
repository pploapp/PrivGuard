'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface ConsentPreferences {
  marketing: boolean;
  analytics: boolean;
  functional: boolean;
  personalization: boolean;
}

interface ConsentBannerProps {
  apiUrl: string;
  dataSubjectId: string;
}

const defaultPreferences: ConsentPreferences = {
  marketing: false,
  analytics: false,
  functional: true,
  personalization: false,
};

export function ConsentBanner({ apiUrl, dataSubjectId }: ConsentBannerProps) {
  const [visible, setVisible] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(`privguard-consent-${dataSubjectId}`);
    if (!stored) {
      setVisible(true);
    } else {
      try {
        const parsed = JSON.parse(stored) as ConsentPreferences;
        setPreferences(parsed);
      } catch {
        setVisible(true);
      }
    }
  }, [dataSubjectId]);

  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setVisible(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [visible]);

  useEffect(() => {
    if (visible && firstFocusableRef.current) {
      firstFocusableRef.current.focus();
    }
  }, [visible]);

  const saveConsent = useCallback(
    async (prefs: ConsentPreferences, action: 'granted' | 'denied') => {
      setLoading(true);
      try {
        const purposes: (keyof ConsentPreferences)[] = [
          'marketing',
          'analytics',
          'functional',
          'personalization',
        ];

        for (const purpose of purposes) {
          const status = prefs[purpose] ? 'granted' : action === 'denied' ? 'denied' : 'withdrawn';
          await fetch(`${apiUrl}/consents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dataSubjectId,
              purpose,
              status,
              ipAddress: '127.0.0.1',
              userAgent: navigator.userAgent,
            }),
          });
        }

        localStorage.setItem(`privguard-consent-${dataSubjectId}`, JSON.stringify(prefs));
        setSaved(true);
        setTimeout(() => {
          setVisible(false);
          setSaved(false);
        }, 1500);
      } catch (err) {
        console.error('Failed to save consent:', err);
      } finally {
        setLoading(false);
      }
    },
    [apiUrl, dataSubjectId]
  );

  const handleAcceptAll = () => {
    const allGranted: ConsentPreferences = {
      marketing: true,
      analytics: true,
      functional: true,
      personalization: true,
    };
    setPreferences(allGranted);
    void saveConsent(allGranted, 'granted');
  };

  const handleRejectAll = () => {
    const allDenied: ConsentPreferences = {
      marketing: false,
      analytics: false,
      functional: false,
      personalization: false,
    };
    setPreferences(allDenied);
    void saveConsent(allDenied, 'denied');
  };

  const handleSavePreferences = () => {
    void saveConsent(preferences, 'granted');
  };

  const togglePurpose = (purpose: keyof ConsentPreferences) => {
    setPreferences((prev) => ({ ...prev, [purpose]: !prev[purpose] }));
  };

  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        aria-label="Open consent preferences"
        style={{
          position: 'absolute',
          bottom: '1rem',
          right: '1rem',
          padding: '0.5rem 1rem',
          background: '#2563eb',
          color: '#fff',
          border: 'none',
          borderRadius: '0.375rem',
          cursor: 'pointer',
        }}
      >
        Manage Consent
      </button>
    );
  }

  return (
    <div
      ref={bannerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Consent preferences"
      tabIndex={-1}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#fff',
        borderTop: '1px solid #e5e7eb',
        padding: '1.5rem',
        boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)',
        zIndex: 9999,
      }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.125rem' }}>
          We value your privacy
        </h3>
        <p style={{ margin: '0 0 1rem', color: '#4b5563', fontSize: '0.875rem' }}>
          We use cookies and similar technologies to enhance your experience,
          analyze traffic, and personalize content. You can customize your
          preferences below.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.75rem',
            marginBottom: '1rem',
          }}
        >
          {(
            [
              ['functional', 'Functional (required)'],
              ['analytics', 'Analytics'],
              ['marketing', 'Marketing'],
              ['personalization', 'Personalization'],
            ] as [keyof ConsentPreferences, string][]
          ).map(([key, label]) => (
            <label
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.375rem',
                cursor: key === 'functional' ? 'not-allowed' : 'pointer',
                opacity: key === 'functional' ? 0.7 : 1,
              }}
            >
              <input
                type="checkbox"
                checked={preferences[key]}
                disabled={key === 'functional' || loading}
                onChange={() => togglePurpose(key)}
                aria-label={label}
                tabIndex={0}
              />
              <span style={{ fontSize: '0.875rem' }}>{label}</span>
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            ref={firstFocusableRef}
            onClick={handleAcceptAll}
            disabled={loading}
            aria-label="Accept all cookies"
            style={{
              padding: '0.625rem 1.25rem',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            {loading ? 'Saving...' : 'Accept All'}
          </button>
          <button
            onClick={handleRejectAll}
            disabled={loading}
            aria-label="Reject all cookies"
            style={{
              padding: '0.625rem 1.25rem',
              background: '#fff',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Reject All
          </button>
          <button
            onClick={handleSavePreferences}
            disabled={loading}
            aria-label="Save custom preferences"
            style={{
              padding: '0.625rem 1.25rem',
              background: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Save Preferences
          </button>
        </div>

        {saved && (
          <p style={{ marginTop: '0.75rem', color: '#059669', fontSize: '0.875rem' }}>
            Preferences saved successfully!
          </p>
        )}
      </div>
    </div>
  );
}
