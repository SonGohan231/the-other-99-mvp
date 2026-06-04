import { ContentItem, RewardBlock, RewardSequence } from '../types';

interface Props {
  item: ContentItem;
  selectedAnswer: string;
  profileProgress: number;
  interactionNum: number;
  onNext: () => void;
}

const BLOCK_TYPE_CLASS: Record<string, string> = {
  community_reveal: 'rb-community',
  community: 'rb-community',
  profile_movement: 'rb-profile',
  profile: 'rb-profile',
  hidden_teaser: 'rb-hidden',
  hidden: 'rb-hidden',
  next_hook: 'rb-hook',
  hook: 'rb-hook',
  unlock: 'rb-unlock',
  rarity: 'rb-rarity',
};

const BLOCK_TYPE_LABEL: Record<string, string> = {
  community_reveal: 'społeczność',
  community: 'społeczność',
  profile_movement: 'twój profil',
  profile: 'twój profil',
  hidden_teaser: 'ukryty profil',
  hidden: 'ukryty profil',
  next_hook: 'co dalej',
  hook: 'co dalej',
  unlock: 'odblokowano',
  rarity: 'rzadkość',
};

function parseRewardBlocks(item: ContentItem): RewardBlock[] {
  if (item.reward_sequence_json) {
    try {
      const seq = JSON.parse(item.reward_sequence_json) as RewardSequence;
      if (Array.isArray(seq.blocks) && seq.blocks.length > 0) {
        return seq.blocks;
      }
    } catch {
      // fall through
    }
  }

  // Build from individual fields
  const blocks: RewardBlock[] = [];

  // Community reveal
  if (item.community_stat_seed_json) {
    try {
      const stat = JSON.parse(item.community_stat_seed_json) as {
        primary_percent?: number;
        secondary_percent?: number;
      };
      if (stat.primary_percent != null) {
        blocks.push({
          type: 'community_reveal',
          text: `${stat.primary_percent}% użytkowników wybrało podobnie.`,
        });
      }
    } catch {
      if (item.community_reveal_type) {
        blocks.push({ type: 'community_reveal', text: 'Twoja odpowiedź wpisuje się w nieoczekiwany wzorzec grupowy.' });
      }
    }
  }

  // Rarity
  const rarityTexts: Record<string, string> = {
    standard: 'Typowa odpowiedź. Każda jest ważna.',
    rare: 'To rzadka odpowiedź — widuje się ją u mniejszości.',
    epic: 'Rzadki wybór. Wchodzisz w obszar nielicznych.',
    legendary: 'Niezwykle rzadka odpowiedź. Odcisnęła ślad na Twoim profilu.',
  };
  blocks.push({ type: 'rarity', text: rarityTexts[item.rarity_tier] ?? '' });

  // Profile movement
  if (item.axis_target) {
    const axes = item.axis_target.split(';').map(a => a.trim()).filter(Boolean).slice(0, 2);
    if (axes.length) {
      blocks.push({
        type: 'profile_movement',
        text: `Twój profil przesuwa się w stronę: ${axes.join(', ')}.`,
      });
    }
  }

  // Hidden signal
  blocks.push({
    type: 'hidden_teaser',
    text: 'To pytanie odsłania więcej niż sama odpowiedź.',
  });

  // Next hook
  if (item.next_hook_pl) {
    blocks.push({ type: 'next_hook', text: item.next_hook_pl });
  }

  return blocks;
}

export default function RewardScreen({
  item,
  profileProgress,
  interactionNum,
  onNext,
}: Props) {
  const blocks = parseRewardBlocks(item);
  const progress = Math.min(profileProgress, 34);

  return (
    <div className="reward-screen">
      {/* Status bar */}
      <div className="status-bar">
        <div className="status-bar-left">
          <span className="status-label">Profil odkryty</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="progress-bar-track" style={{ flex: 1 }}>
              <div
                className="progress-bar-fill"
                style={{ width: `${(progress / 34) * 100}%` }}
              />
            </div>
            <span className="status-value">{progress.toFixed(1)}%</span>
          </div>
        </div>
        <span className="status-interaction">{interactionNum}&nbsp;/&nbsp;30</span>
      </div>

      <div className="reward-content">
        <p className="reward-heading animate-in">Twoja odpowiedź</p>

        {blocks.map((block, i) => (
          <div
            key={i}
            className={`reward-block ${BLOCK_TYPE_CLASS[block.type] ?? 'rb-plain'}`}
          >
            {BLOCK_TYPE_LABEL[block.type] && (
              <p className="reward-block-label">
                {BLOCK_TYPE_LABEL[block.type]}
              </p>
            )}
            <p className="reward-block-text">{block.text}</p>
          </div>
        ))}

        <div className="reward-actions">
          <button className="btn btn-primary" onClick={onNext} style={{ maxWidth: '320px' }}>
            Pokaż następne
          </button>
        </div>
      </div>
    </div>
  );
}
