import type { AppLocale } from './locale';
import type { MessageKey } from './messages';

export const messageExtras: Record<AppLocale, Partial<Record<MessageKey, string>>> = {
  'zh-CN': {
    aiAssistant: 'AI 助手',
    sessionExpiredTitle: '登录状态已失效',
    sessionExpiredMessage:
      '你的登录已过期，已自动切换为游客模式。如需收藏、同步最近查看等功能，请重新登录。',
    sessionExpiredDismiss: '知道了',
  },
  'en-US': {
    aiAssistant: 'AI Assistant',
    sessionExpiredTitle: 'Session expired',
    sessionExpiredMessage:
      'Your login has expired and the app has switched back to guest mode. Log in again to use favorites and synced history.',
    sessionExpiredDismiss: 'Dismiss',
  },
};
