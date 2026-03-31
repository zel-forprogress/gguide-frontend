import type { MouseEvent } from 'react';

interface FavoriteButtonProps {
  active: boolean;
  loading?: boolean;
  compact?: boolean;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}

const FavoriteButton = ({
  active,
  loading = false,
  compact = false,
  onClick,
}: FavoriteButtonProps) => {
  return (
    <button
      type="button"
      className={`favorite-btn${compact ? ' favorite-btn-compact' : ''}${
        active ? ' is-active' : ''
      }`}
      onClick={onClick}
      disabled={loading}
      aria-pressed={active}
    >
      {loading ? '处理中...' : active ? '已收藏' : '收藏'}
    </button>
  );
};

export default FavoriteButton;
