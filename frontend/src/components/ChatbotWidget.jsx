import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Sparkles, User } from 'lucide-react';
import { chatbotService } from '../services/chatbotService';

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hello! Welcome to Perfect Rent & Remind. How can I assist you with your clothing rental today?",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const quickPrompts = [
    'How do I rent clothes?',
    'What is the security deposit?',
    'How is late fine calculated?',
    'Can I cancel my booking?',
  ];

  const handleSend = async (textToSend) => {
    const query = textToSend || input.trim();
    if (!query) return;

    const userMsg = { sender: 'user', text: query };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const data = await chatbotService.sendMessage(query);
      const botReply = { sender: 'bot', text: data.reply };
      setMessages((prev) => [...prev, botReply]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Sorry, I had trouble processing your query. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-2 bg-[#121417] text-white px-4 py-3 rounded-full shadow-xl hover:bg-[#2A2E35] transition-all hover:scale-105 border border-[#C5A059]/40 group"
          title="Rental Support Assistant"
        >
          <div className="w-6 h-6 rounded-full bg-[#C5A059] flex items-center justify-center text-white">
            <Bot className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">
            Rental Assistant
          </span>
          <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
        </button>
      )}

      {/* Chat Window Modal */}
      {isOpen && (
        <div className="w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-[#E8E6E1] overflow-hidden flex flex-col h-[460px] animate-fade-in">
          {/* Header */}
          <div className="bg-[#121417] text-white p-4 flex items-center justify-between border-b border-[#25282E]">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-[#C5A059] flex items-center justify-center text-white font-bold">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif-title font-bold text-sm leading-tight text-white">
                  Perfect Rent Assistant
                </h4>
                <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">
                  ● Online Support
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white p-1 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FAF9F6]">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex items-start space-x-2 ${
                  msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${
                    msg.sender === 'user' ? 'bg-[#121417] text-white' : 'bg-[#C5A059] text-white'
                  }`}
                >
                  {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div
                  className={`p-3 rounded-2xl text-xs max-w-[80%] leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#121417] text-white rounded-tr-none'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-2xs'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center space-x-2 text-xs text-gray-400 italic">
                <Bot className="w-4 h-4 text-[#C5A059] animate-spin" />
                <span>Assistant is typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="p-2 bg-white border-t border-gray-100 flex gap-1.5 overflow-x-auto no-scrollbar">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(qp)}
                className="whitespace-nowrap px-2.5 py-1 bg-[#FAF9F6] hover:bg-[#C5A059]/10 text-gray-700 hover:text-[#C5A059] text-[10px] font-semibold rounded-full border border-gray-200 transition-colors shrink-0"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-gray-200 flex items-center space-x-2"
          >
            <input
              type="text"
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-3 py-2 text-xs bg-[#FAF9F6] border border-gray-300 rounded-xl focus:outline-none focus:border-[#C5A059]"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2 bg-[#121417] text-white hover:bg-[#C5A059] rounded-xl disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatbotWidget;
