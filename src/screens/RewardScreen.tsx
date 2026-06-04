import { ContentItem, RewardBlock, RewardSequence } from '../types';
import { useT, useLang } from '../context/LangContext';
import { localizedCsvField, Translations } from '../i18n';

interface Props {
  item: ContentItem;
  selectedAnswer: string;
  profileProgress: number;
  testIndex: number;
  testTotal: number;
  onNext: () => void;
}

const BLOCK_TYPE_CLASS: Record<string, string> = {
  community_reveal: 'rb-community',
  community: 'rb-community',
  profile_movement: 'rb-profile',
  profile: 'rb-profile',
  next_hook: 'rb-hook',
  hook: 'rb-hook',
  unlock: 'rb-unlock',
  rarity: 'rb-rarity',
};

const HIDDEN_TYPES = new Set(['hidden_teaser', 'hidden']);

function parseVisibleBlocks(item: ContentItem, t: Translations, lang: string): RewardBlock[] {
  if (item.reward_sequence_json) {
    try {
      const seq = JSON.parse(item.reward_sequence_json) as RewardSequence;
      if (Array.isArray(seq.blocks) && seq.blocks.length > 0) {
        return seq.blocks.filter((b) => !HIDDEN_TYPES.has(b.type));
      }
    } catch { /* fall through */ }
  }

  const blocks: RewardBlock[] = [];

  if (item.community_stat_seed_json) {
    try {
      const stat = JSON.parse(item.community_stat_seed_json) as { primary_percent?: number };
      if (stat.primary_percent != null) {
        blocks.push({ type: 'community_reveal', text: `${stat.primary_percent}%` });
      }
    } catch {
      if (item.community_reveal_type) {
        blocks.push({ type: 'community_reveal', text: '' });
      }
    }
  }

  blocks.push({ type: 'rarity', text: t.reward.rarityText[item.rarity_tier] ?? '' });

  if (item.axis_target) {
    const axes = item.axis_target.split(';').map((a) => a.trim()).filter(Boolean).slice(0, 2);
    if (axes.length) {
      blocks.push({ type: 'profile_movement', text: t.reward.profileMovement(axes.join(', ')) });
    }
  }

  const fields = item as unknown as Record<string, string>;
  const nextHook = localizedCsvField(fields, 'next_hook', lang as 'en' | 'pl');
  if (nextHook) {
    blocks.push({ type: 'next_hook', text: nextHook });
  }

  return blocks;
}

export default function RewardScreen({ item, profileProgress, testIndex, testTotal, onNext }: Props) {
  const t = useT();
  const [lang] = useLang();
  const blocks = parseVisibleBlocks(item, t, lang);

  return (
    <div className="reward-screen">
      {/* Status bar */}
      <div className="status-bar" role="status">
        <div className="status-bar-left">
          <span className="status-label">{t.interaction.profileDiscovered}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="progress-bar-track" style={{ flex: 1 }}>
              <div className="progress-bar-fill" style={{ width: `${Math.min(100, (profileProgress / 85) * 100)}%` }} />
            </div>
            <span className="status-value">{profileProgress.toFixed(1)}%</span>
          </div>
        </div>
        <span className="status-interaction">{testIndex}&nbsp;/&nbsp;{testTotal}</span>
      </div>

      <div className="reward-content">
        <p className="reward-heading animate-in">{t.reward.heading}</p>

        {blocks.map((block, i) => (
          <div key={i} className={`reward-block ${BLOCK_TYPE_CLASS[block.type] ?? 'rb-plain'}`}>
            {t.reward.blockLabel[block.type] && (
              <p className="reward-block-label">{t.reward.blockLabel[block.type]}</p>
            )}
            <p className="reward-block-text">{block.text}</p>
          </div>
        ))}

        {/* Hidden profile — bottom, secondary */}
        <div className="reward-block-hidden-footer">
          {t.reward.hiddenFooter}
        </div>

        <div className="reward-actions">
          <button
            className="btn btn-primary"
            onClick={onNext}
            style={{ maxWidth: '320px' }}
            aria-label={t.reward.showNext}
          >
            {t.reward.showNext}
          </button>
        </div>
      </div>
    </div>
  );
}
