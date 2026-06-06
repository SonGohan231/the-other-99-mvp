import { useT } from '../context/LangContext';
import { LegalPage } from '../types';

interface Props {
  page: LegalPage;
  onBack: () => void;
}

export default function LegalScreen({ page, onBack }: Props) {
  const t = useT();

  const titles: Record<LegalPage, string> = {
    terms: t.legal.termsTitle,
    privacy: t.legal.privacyTitle,
    cookie: t.legal.cookieTitle,
    'subscription-terms': t.legal.subscriptionTermsTitle,
    disclaimer: t.legal.disclaimerTitle,
    help: t.legal.helpTitle,
  };

  const title = titles[page] ?? page;

  function Section({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
          {label}
        </p>
        {children}
      </div>
    );
  }

  function DraftNote() {
    return (
      <div style={{
        padding: '10px 14px', background: 'rgba(245,158,11,0.06)',
        border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-sm)', marginBottom: '20px',
      }}>
        <p style={{ fontSize: '0.72rem', color: 'var(--gold)', fontWeight: 600 }}>
          {t.legal.placeholder}
        </p>
      </div>
    );
  }

  const bodyStyle: React.CSSProperties = { fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.65 };

  function renderContent() {
    if (page === 'disclaimer') {
      return (
        <p style={bodyStyle}>{t.legal.disclaimerBody}</p>
      );
    }

    if (page === 'privacy') {
      const bodies = (t.legal as Record<string, unknown>).privacyBodies as Record<string, string> | undefined;
      return (
        <>
          {Object.entries(t.legal.privacySections).map(([key, label]) => (
            <Section key={key} label={label}>
              <p style={bodyStyle}>
                {bodies?.[key] ?? t.legal.placeholder}
              </p>
            </Section>
          ))}
        </>
      );
    }

    if (page === 'subscription-terms') {
      const bodies = (t.legal as Record<string, unknown>).subscriptionBodies as Record<string, string> | undefined;
      return (
        <>
          <DraftNote />
          {Object.entries(t.legal.subscriptionSections).map(([key, label]) => (
            <Section key={key} label={label}>
              <p style={bodyStyle}>
                {bodies?.[key] ?? t.legal.placeholder}
              </p>
            </Section>
          ))}
        </>
      );
    }

    if (page === 'terms') {
      const termsBody = (t.legal as Record<string, unknown>).termsBody as string | undefined;
      return (
        <>
          <DraftNote />
          <p style={{ ...bodyStyle, whiteSpace: 'pre-line' }}>
            {termsBody ?? t.legal.placeholder}
          </p>
        </>
      );
    }

    if (page === 'help') {
      const helpBody = (t.legal as Record<string, unknown>).helpBody as string | undefined;
      return (
        <p style={bodyStyle}>{helpBody ?? t.legal.placeholder}</p>
      );
    }

    return (
      <>
        <DraftNote />
        <p style={bodyStyle}>{t.legal.placeholder}</p>
      </>
    );
  }

  return (
    <div className="screen-centered" style={{ background: 'var(--bg)', alignItems: 'stretch' }}>
      <div style={{ maxWidth: 480, width: '100%', margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <button className="btn btn-ghost" onClick={onBack} style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
            {t.legal.back}
          </button>
          <h1 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            {title}
          </h1>
        </div>

        {renderContent()}
      </div>
    </div>
  );
}
