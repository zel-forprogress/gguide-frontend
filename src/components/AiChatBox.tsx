import React, { useEffect, useRef, useState } from 'react';
import { chatWithAiApi, type AiMessage } from '../services/api';

interface AiChatBoxProps {
  onClose: () => void;
  layout?: 'floating' | 'panel';
}

const AiChatBox: React.FC<AiChatBoxProps> = ({ onClose, layout = 'panel' }) => {
  const [messages, setMessages] = useState<AiMessage[]>([
    {
      role: 'assistant',
      content:
        '你好，我是 G-Guide 的 AI 助手。你可以直接问我游戏推荐、类型对比、入门建议，或者让系统按你的口味帮你筛选平台里的游戏。',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className={`ai-chat-container ${layout === 'panel' ? 'is-panel' : 'is-floating'}`}>
      <div className="ai-chat-header">
        <div className="ai-chat-title">
          <div className="ai-status-dot"></div>
          G-Guide AI 助手
        </div>
        <button className="ai-chat-close" onClick={onClose} aria-label="关闭 AI 助手">
          &times;
        </button>
      </div>

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

      <div className="ai-chat-input-area">
        <textarea
          placeholder="输入你的问题，比如：推荐几款适合放松的游戏"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button
          className="ai-send-btn"
          onClick={() => void handleSend()}
          disabled={!inputValue.trim() || isLoading}
          aria-label="发送消息"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default AiChatBox;
