import React, { useEffect, useRef, useState } from 'react';
import { chatWithAiApi, type AiMessage } from '../services/api';

interface AiChatBoxProps {
  onClose: () => void;
  layout?: 'floating' | 'panel';
}

const AiChatBox: React.FC<AiChatBoxProps> = ({ onClose, layout = 'panel' }) => {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasStartedChat = messages.length > 0 || isLoading;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) {
      return;
    }

    const nextMessages = [...messages, { role: 'user', content: inputValue.trim() } as AiMessage];
    setMessages(nextMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await chatWithAiApi(nextMessages);
      if (response.code !== 200) {
        throw new Error(response.message);
      }

      setMessages([...nextMessages, { role: 'assistant', content: response.data }]);
    } catch (error: any) {
      setMessages([
        ...nextMessages,
        {
          role: 'assistant',
          content: `抱歉，刚刚处理失败了：${error.message}`,
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
        <button className="ai-input-tool-btn" type="button" aria-label="添加">
          +
        </button>
      ) : null}
      <textarea
        placeholder={variant === 'empty' ? '想找什么游戏，尽管问' : '输入你的问题，比如：推荐几款适合放松的游戏'}
        value={inputValue}
        onChange={(event) => setInputValue(event.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
      />
      {variant === 'empty' ? (
        <button className="ai-input-tool-btn" type="button" aria-label="语音输入">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <path d="M12 19v3" />
          </svg>
        </button>
      ) : null}
      <button
        className={`ai-send-btn ${variant === 'empty' ? 'is-empty-send' : ''}`}
        onClick={() => void handleSend()}
        disabled={!inputValue.trim() || isLoading}
        aria-label="发送消息"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.6">
          <path d="M12 19V5" />
          <path d="M5 12l7-7 7 7" />
        </svg>
      </button>
    </div>
  );

  return (
    <div
      className={`ai-chat-container ${layout === 'panel' ? 'is-panel' : 'is-floating'}${
        !hasStartedChat ? ' is-empty' : ''
      }`}
    >
      {hasStartedChat || layout === 'floating' ? (
        <div className="ai-chat-header">
          <div className="ai-chat-title">
            <div className="ai-status-dot"></div>
            G-Guide AI 助手
          </div>
          <button className="ai-chat-close" onClick={onClose} aria-label="关闭 AI 助手">
            &times;
          </button>
        </div>
      ) : null}

      {hasStartedChat ? (
        <>
          <div className="ai-chat-messages">
            {messages.map((message, index) => (
              <div key={index} className={`ai-message-wrapper ${message.role}`}>
                <div className="ai-message-avatar">{message.role === 'assistant' ? 'AI' : '你'}</div>
                <div className="ai-message-content">{message.content}</div>
              </div>
            ))}

            {isLoading ? (
              <div className="ai-message-wrapper assistant">
                <div className="ai-message-avatar">AI</div>
                <div className="ai-message-content loading">
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
          <h1>你想玩什么？</h1>
          <div className="ai-empty-input-wrap">{renderInput('empty')}</div>
          <div className="ai-empty-suggestions">
            <button type="button" onClick={() => setInputValue('给我推荐几款适合放松的游戏')}>
              推荐放松游戏
            </button>
            <button type="button" onClick={() => setInputValue('我喜欢剧情和探索，有什么游戏适合我？')}>
              剧情探索
            </button>
            <button type="button" onClick={() => setInputValue('帮我对比几款高分动作游戏')}>
              高分动作
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiChatBox;
