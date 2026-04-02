import type { MouseEvent } from 'react';
import { useLocale } from '../i18n/LocaleProvider';

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
  const { t } = useLocale();

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
      {loading ? t('processing') : active ? t('favorited') : t('favorite')}
    </button>
  );
};

export default FavoriteButton;
