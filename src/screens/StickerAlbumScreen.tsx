import { COMPANIONS, getUnlockedCompanions } from '../utils/companionStickers';
import { useLang } from '../context/LangContext';

interface Props {
  totalAnswers: number;
  onBack: () => void;
}

export default function StickerAlbumScreen({ totalAnswers, onBack }: Props) {
  const [lang] = useLang();
  const unlocked = getUnlockedCompanions();

  return (
    <div className="screen" style={{ background: 'var(--bg)', minHeight: '100dvh', overflowY: 'auto' }}>
      <main style={{ maxWidth: '480px', margin: '0 auto', width: '100%', padding: '20px 20px 60px' }}>
        <button
          onClick={onBack}
          className="tappable"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: '0.78rem', padding: '4px 0 20px', textAlign: 'left' }}
        >
          ← {lang === 'pl' ? 'Wróć' : 'Back'}
        </button>

        <div style={{ marginBottom: '28px' }}>
          <p style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent-light)', marginBottom: '6px' }}>
            {lang === 'pl' ? 'Album sygnałów' : 'Signal Album'}
          </p>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1.2, marginBottom: '8px' }}>
            {lang === 'pl' ? 'Towarzysze sygnałów' : 'Signal Companions'}
          </h1>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
            {lang === 'pl'
              ? 'Towarzysze pojawiają się w określonych momentach Twojej podróży odkrywania.'
              : 'Companions appear at specific moments in your discovery journey.'}
          </p>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            {unlocked.length} / {COMPANIONS.length}{' '}
            {lang === 'pl' ? 'odblokowanych' : 'unlocked'}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {COMPANIONS.map((companion) => {
            const isUnlocked = unlocked.includes(companion.id);
            const isMet = totalAnswers >= companion.unlockAtAnswerCount;
            const answersLeft = companion.unlockAtAnswerCount - totalAnswers;

            return (
              <div
                key={companion.id}
                style={{
                  padding: '18px 16px',
                  background: isUnlocked
                    ? 'rgba(124,58,237,0.08)'
                    : 'rgba(255,255,255,0.02)',
                  border: isUnlocked
                    ? '1px solid rgba(124,58,237,0.25)'
                    : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '14px',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{ fontSize: isUnlocked ? '2.5rem' : '1.8rem', marginBottom: '8px', opacity: isUnlocked ? 1 : 0.25, filter: isUnlocked ? 'none' : 'grayscale(1)' }}>
                  {companion.emoji}
                </div>
                <p style={{ fontSize: '0.8rem', fontWeight: 700, color: isUnlocked ? 'var(--text)' : 'var(--text-dim)', marginBottom: '3px', textTransform: 'capitalize' }}>
                  {companion.animal}
                </p>
                <p style={{ fontSize: '0.62rem', color: isUnlocked ? 'var(--accent-light)' : 'var(--text-dim)', marginBottom: '6px', fontStyle: 'italic' }}>
                  {companion.emotionalRole}
                </p>
                {isUnlocked ? (
                  <span style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--teal-light)' }}>
                    {lang === 'pl' ? 'Odblokowany' : 'Collected'}
                  </span>
                ) : isMet ? (
                  <span style={{ fontSize: '0.58rem', color: 'var(--accent-light)' }}>
                    {lang === 'pl' ? 'Gotowy do odebrania' : 'Ready to collect'}
                  </span>
                ) : (
                  <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)' }}>
                    {lang === 'pl'
                      ? `Odblokuj za ${answersLeft} ${answersLeft === 1 ? 'odpowiedź' : 'odpowiedzi'}`
                      : `${answersLeft} answer${answersLeft !== 1 ? 's' : ''} away`}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: '28px', padding: '14px 18px', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px' }}>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-dim)', lineHeight: 1.6, fontStyle: 'italic' }}>
            {lang === 'pl'
              ? 'Towarzysze pojawiają się, gdy Twój profil osiągnie kluczowe momenty. Zbierz je podczas odpowiadania na pytania.'
              : 'Companions appear when your profile reaches key moments. Collect them while answering questions.'}
          </p>
        </div>
      </main>
    </div>
  );
}
