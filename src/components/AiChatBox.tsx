import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '../i18n/LocaleProvider';
import {
  chatWithAiApi,
  getAiConversationApi,
  type AiConversationSummary,
  type AiMessage,
} from '../services/api';
import { hasStoredToken } from '../utils/auth';

interface AiChatBoxProps {
  onClose: () => void;
  layout?: 'floating' | 'panel';
  conversationId?: string | null;
  onConversationSaved?: (conversation: AiConversationSummary) => void;
}

type ChatMessage = AiMessage & {
  action?: 'login';
};

const renderInlineMarkdown = (text: string) =>
  text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2).trim()}</strong>;
    }

    return <React.Fragment key={index}>{part}</React.Fragment>;
  });

const renderAssistantContent = (content: string) => {
  const sections = content
    .split(/\n\s*\n/)
    .map((section) => section.trim())
    .filter(Boolean);

  if (sections.length === 0) {
    return null;
  }

  return sections.map((section, sectionIndex) => {
    const lines = section.split('\n').map((line) => line.trim()).filter(Boolean);
    const numberedMatch = lines[0]?.match(/^(\d+)\.\s+(.*)$/);

    if (numberedMatch) {
      const bulletLines = lines
        .slice(1)
        .map((line) => line.replace(/^[*-]\s+/, '').trim())
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

    if (lines.every((line) => /^[*-]\s+/.test(line))) {
      return (
        <ul className="ai-rendered-list" key={sectionIndex}>
          {lines.map((line, lineIndex) => (
            <li key={lineIndex}>{renderInlineMarkdown(line.replace(/^[*-]\s+/, '').trim())}</li>
          ))}
        </ul>
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
  onConversationSaved,
}) => {
  const navigate = useNavigate();
  const { t } = useLocale();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(conversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasStartedChat = messages.length > 0 || isLoading;
  const modeClass = hasStartedChat ? 'is-chat' : 'is-empty';

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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

    try {
      const response = await chatWithAiApi(
        nextMessages.map(({ role, content }) => ({ role, content })),
        currentConversationId
      );
      if (response.code !== 200) {
        throw new Error(response.message);
      }

      const savedConversationId = response.data.conversationId;
      setCurrentConversationId(savedConversationId);
      setMessages(response.data.messages || [
        ...nextMessages,
        { role: 'assistant', content: response.data.response },
      ]);
      onConversationSaved?.({
        id: savedConversationId,
        title: response.data.title,
        updatedAt: response.data.updatedAt,
        messageCount: response.data.messages?.length || nextMessages.length + 1,
      });
    } catch (error: any) {
      setMessages([
        ...nextMessages,
        {
          role: 'assistant',
          content: `${t('aiErrorPrefix')}${error.message}`,
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
      {variant === 'empty' ? (
        <button className="ai-input-tool-btn" type="button" aria-label={t('aiAddAction')}>
          +
        </button>
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
          <div className="ai-chat-messages">
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

            {isLoading ? (
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

            <div ref={messagesEndRef} />
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
