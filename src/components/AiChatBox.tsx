import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '../i18n/useLocale';
import {
  getAiConversationApi,
  getAppErrorMessage,
  streamChatWithAiApi,
  type AiConversationSummary,
  type AiMessage,
} from '../services/api';
import { hasStoredToken } from '../utils/auth';

interface AiChatBoxProps {
  onClose: () => void;
  layout?: 'floating' | 'panel';
  conversationId?: string | null;
  contextGameId?: string | null;
  contextGameTitle?: string | null;
  onConversationSaved?: (conversation: AiConversationSummary) => void;
}

type ChatMessage = AiMessage & {
  action?: 'login';
};

const STREAM_RENDER_DELAY_MS = 16;
const STREAM_RENDER_CHUNK_SIZE = 6;

const wait = (milliseconds: number) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });

const renderInlineMarkdown = (text: string) =>
  text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2).trim()}</strong>;
    }

    return <React.Fragment key={index}>{part}</React.Fragment>;
  });

const normalizeAssistantContent = (content: string) =>
  content
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+$/gm, '')
    .replace(/([^\n])\s+(?=(?:◆|◇|•|·|-|\*)\s+)/g, '$1\n')
    .replace(/([^\n])\s+(?=\d+[.)]\s+)/g, '$1\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const getBulletText = (line: string) => line.replace(/^(?:◆|◇|•|·|-|\*)\s+/, '').trim();

const isBulletLine = (line: string) => /^(?:◆|◇|•|·|-|\*)\s+/.test(line);

const renderAssistantContent = (content: string) => {
  const normalizedContent = normalizeAssistantContent(content);
  const sections = normalizedContent
    .split(/\n\s*\n/)
    .map((section) => section.trim())
    .filter(Boolean);

  if (sections.length === 0) {
    return null;
  }

  return sections.map((section, sectionIndex) => {
    const lines = section.split('\n').map((line) => line.trim()).filter(Boolean);
    const numberedMatch = lines[0]?.match(/^(\d+)[.)]\s+(.*)$/);

    if (numberedMatch) {
      const bulletLines = lines
        .slice(1)
        .map((line) => (isBulletLine(line) ? getBulletText(line) : line))
        .filter(Boolean);

      return (
        <div className="ai-rendered-card" key={sectionIndex}>
          <div className="ai-rendered-card-head">
            <span>{numberedMatch[1]}</span>
            <p>{renderInlineMarkdown(numberedMatch[2])}</p>
          </div>
          {bulletLines.length > 0 ? (
            <ul className="ai-rendered-list">
              {bulletLines.map((line, lineIndex) => (
                <li key={lineIndex}>{renderInlineMarkdown(line)}</li>
              ))}
            </ul>
          ) : null}
        </div>
      );
    }

    if (lines.every(isBulletLine)) {
      return (
        <ul className="ai-rendered-list" key={sectionIndex}>
          {lines.map((line, lineIndex) => (
            <li key={lineIndex}>{renderInlineMarkdown(getBulletText(line))}</li>
          ))}
        </ul>
      );
    }

    if (lines.some(isBulletLine)) {
      const firstBulletIndex = lines.findIndex(isBulletLine);
      const introLines = lines.slice(0, firstBulletIndex).filter(Boolean);
      const bulletLines = lines.slice(firstBulletIndex);

      return (
        <div className="ai-rendered-section" key={sectionIndex}>
          {introLines.length > 0 ? (
            <p className="ai-rendered-paragraph">{renderInlineMarkdown(introLines.join(' '))}</p>
          ) : null}
          <ul className="ai-rendered-list">
            {bulletLines.map((line, lineIndex) => (
              <li key={lineIndex}>
                {renderInlineMarkdown(isBulletLine(line) ? getBulletText(line) : line)}
              </li>
            ))}
          </ul>
        </div>
      );
    }

    return (
      <p className="ai-rendered-paragraph" key={sectionIndex}>
        {renderInlineMarkdown(lines.join(' '))}
      </p>
    );
  });
};

const AiChatBox: React.FC<AiChatBoxProps> = ({
  onClose,
  layout = 'panel',
  conversationId = null,
  contextGameId = null,
  contextGameTitle = null,
  onConversationSaved,
}) => {
  const navigate = useNavigate();
  const { t } = useLocale();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(conversationId);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const hasStartedChat = messages.length > 0 || isLoading;
  const modeClass = hasStartedChat ? 'is-chat' : 'is-empty';
  const isStreamingAnswer =
    isLoading &&
    messages[messages.length - 1]?.role === 'assistant' &&
    Boolean(messages[messages.length - 1]?.content);

  useEffect(() => {
    setCurrentConversationId(conversationId);

    if (!conversationId) {
      setMessages([]);
      setInputValue('');
      setIsLoading(false);
      return;
    }

    let isCancelled = false;

    const loadConversation = async () => {
      try {
        setIsLoading(true);
        const response = await getAiConversationApi(conversationId);
        if (!isCancelled && response.code === 200) {
          setMessages(response.data.messages || []);
        }
      } catch (error) {
        console.error('Failed to load AI conversation', error);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadConversation();

    return () => {
      isCancelled = true;
    };
  }, [conversationId]);

  useEffect(() => {
    const messagesContainer = messagesContainerRef.current;
    if (!messagesContainer) {
      return;
    }

    messagesContainer.scrollTo({
      top: messagesContainer.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) {
      return;
    }

    const nextMessages = [...messages, { role: 'user', content: inputValue.trim() } as ChatMessage];
    const isFirstMessage = messages.length === 0;
    setMessages(nextMessages);
    setInputValue('');
    setIsLoading(true);

    if (isFirstMessage) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (!hasStoredToken()) {
      setMessages([
        ...nextMessages,
        {
          role: 'assistant',
          content: t('aiLoginRequiredMessage'),
          action: 'login',
        },
      ]);
      setIsLoading(false);
      return;
    }

    let assistantContent = '';
    let queuedContent = '';
    let isConsumingQueue = false;
    let streamFinished = false;
    let hasStreamError = false;
    let doneConversation: AiConversationSummary | null = null;
    let resolveQueue: (() => void) | null = null;
    const queueDrained = new Promise<void>((resolve) => {
      resolveQueue = resolve;
    });

    const finishIfReady = () => {
      if (queuedContent.length > 0 || isConsumingQueue || !streamFinished) {
        return;
      }

      if (doneConversation) {
        onConversationSaved?.(doneConversation);
      }
      resolveQueue?.();
      resolveQueue = null;
    };

    const consumeQueuedContent = async () => {
      if (isConsumingQueue) {
        return;
      }

      isConsumingQueue = true;

      while (queuedContent.length > 0 && !hasStreamError) {
        const nextChunk = queuedContent.slice(0, STREAM_RENDER_CHUNK_SIZE);
        queuedContent = queuedContent.slice(nextChunk.length);
        assistantContent += nextChunk;
        setMessages([...nextMessages, { role: 'assistant', content: assistantContent }]);
        await wait(STREAM_RENDER_DELAY_MS);
      }

      isConsumingQueue = false;
      finishIfReady();
    };

    try {
      setMessages([...nextMessages, { role: 'assistant', content: '' }]);

      await streamChatWithAiApi(
        nextMessages.map(({ role, content }) => ({ role, content })),
        {
          conversationId: currentConversationId,
          contextGameId,
        },
        (event) => {
          if (event.type === 'delta') {
            queuedContent += event.content;
            void consumeQueuedContent();
            return;
          }

          if (event.type === 'done') {
            const savedConversationId = event.conversationId;
            setCurrentConversationId(savedConversationId);
            doneConversation = {
              id: savedConversationId,
              title: event.title,
              updatedAt: event.updatedAt,
              messageCount: event.messageCount || event.messages.length || nextMessages.length + 1,
            };
            finishIfReady();
          }
        }
      );

      streamFinished = true;
      finishIfReady();
      await queueDrained;
    } catch (error: unknown) {
      hasStreamError = true;
      queuedContent = '';
      setMessages([
        ...nextMessages,
        {
          role: 'assistant',
          content: assistantContent
            ? `${assistantContent}\n\n${t('aiErrorPrefix')}${getAppErrorMessage(error, 'AI assistant unavailable')}`
            : `${t('aiErrorPrefix')}${getAppErrorMessage(error, 'AI assistant unavailable')}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  const renderInput = (variant: 'empty' | 'chat') => (
    <div className={`ai-chat-input-area ${variant === 'empty' ? 'is-empty-input' : ''}`}>
      {contextGameId && contextGameTitle ? (
        <span className="ai-context-chip" title={contextGameTitle}>
          <span>{t('aiContextGameLabel')}</span>
          <strong>{contextGameTitle}</strong>
        </span>
      ) : null}
      <textarea
        placeholder={variant === 'empty' ? t('aiEmptyPlaceholder') : t('aiChatPlaceholder')}
        value={inputValue}
        onChange={(event) => setInputValue(event.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
      />
      <button
        className={`ai-send-btn ${variant === 'empty' ? 'is-empty-send' : ''}`}
        onClick={() => void handleSend()}
        disabled={!inputValue.trim() || isLoading}
        aria-label={t('aiSendMessage')}
      >
        <span className="ai-send-arrow" aria-hidden="true"></span>
      </button>
    </div>
  );

  return (
    <div
      className={`ai-chat-container ${layout === 'panel' ? 'is-panel' : 'is-floating'} ${modeClass}`}
    >
      {layout === 'floating' ? (
        <div className="ai-chat-header">
          <div className="ai-chat-title">
            <div className="ai-status-dot"></div>
            G-Guide {t('aiAssistant')}
          </div>
          <button className="ai-chat-close" onClick={onClose} aria-label={t('aiAssistant')}>
            &times;
          </button>
        </div>
      ) : null}

      {hasStartedChat ? (
        <>
          <div className="ai-chat-messages" ref={messagesContainerRef}>
            {messages.map((message, index) => (
              <div key={index} className={`ai-message-wrapper ${message.role}`}>
                <div className="ai-message-avatar">{message.role === 'assistant' ? 'AI' : t('aiUserAvatar')}</div>
                <div className="ai-message-content">
                  {message.role === 'assistant' ? renderAssistantContent(message.content) : message.content}
                  {message.action === 'login' ? (
                    <button
                      className="ai-message-action-btn"
                      type="button"
                      onClick={() => navigate('/auth')}
                    >
                      {t('aiLoginRequiredAction')}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}

            {isLoading && !isStreamingAnswer ? (
              <div className="ai-message-wrapper assistant">
                <div className="ai-message-avatar">AI</div>
                <div className="ai-message-content loading">
                  <span className="ai-thinking-text">{t('aiThinking')}</span>
                  <span className="dot">.</span>
                  <span className="dot">.</span>
                  <span className="dot">.</span>
                </div>
              </div>
            ) : null}
          </div>

          {renderInput('chat')}
        </>
      ) : (
        <div className="ai-empty-state">
          <h1>{t('aiEmptyTitle')}</h1>
          <div className="ai-empty-input-wrap">{renderInput('empty')}</div>
          <div className="ai-empty-suggestions">
            <button type="button" onClick={() => setInputValue(t('aiRelaxSuggestion'))}>
              {t('aiRelaxPrompt')}
            </button>
            <button type="button" onClick={() => setInputValue(t('aiStorySuggestion'))}>
              {t('aiStoryPrompt')}
            </button>
            <button type="button" onClick={() => setInputValue(t('aiActionSuggestion'))}>
              {t('aiActionPrompt')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiChatBox;
