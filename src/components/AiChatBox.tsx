import React, { useState, useRef, useEffect } from 'react';
import { chatWithAiApi, type AiMessage } from '../services/api';

interface AiChatBoxProps {
  onClose: () => void;
}

const AiChatBox: React.FC<AiChatBoxProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<AiMessage[]>([
    { role: 'assistant', content: '你好！我是 G-Guide 的 AI 助手。有什么我可以帮你的吗？你可以问我关于游戏推荐、攻略或者平台使用的问题。' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMsg: AiMessage = { role: 'user', content: inputValue.trim() };
    const newMessages = [...messages, userMsg];
    
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await chatWithAiApi(newMessages);
      if (response.code === 200) {
        setMessages([...newMessages, { role: 'assistant', content: response.data }]);
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      setMessages([...newMessages, { role: 'assistant', content: `抱歉，我遇到了一点问题: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="ai-chat-container">
      <div className="ai-chat-header">
        <div className="ai-chat-title">
          <div className="ai-status-dot"></div>
          G-Guide AI 助手
        </div>
        <button className="ai-chat-close" onClick={onClose}>&times;</button>
      </div>
      
      <div className="ai-chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`ai-message-wrapper ${msg.role}`}>
            <div className="ai-message-avatar">
              {msg.role === 'assistant' ? '🤖' : '👤'}
            </div>
            <div className="ai-message-content">
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="ai-message-wrapper assistant">
            <div className="ai-message-avatar">🤖</div>
            <div className="ai-message-content loading">
              <span className="dot">.</span><span className="dot">.</span><span className="dot">.</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="ai-chat-input-area">
        <textarea
          placeholder="输入你的问题..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          rows={1}
        />
        <button 
          className="ai-send-btn" 
          onClick={handleSend}
          disabled={!inputValue.trim() || isLoading}
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
