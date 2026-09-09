import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useRealtime } from '../context/RealtimeContext';
import { api } from '../api';
import VoiceNoteRecorder from '../components/chat/VoiceNoteRecorder';
import AudioMessagePlayer from '../components/chat/AudioMessagePlayer';
import VideoCallModal from '../components/chat/VideoCallModal';
import { 
  MessageSquare, Send, Mic, Paperclip, Video, Phone, 
  Users, User, MoreVertical, Search, Trash2, Hash, ChevronLeft
} from 'lucide-react';

export default function MessagesPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { messages: realtimeMsgs } = useRealtime();

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [textInput, setTextInput] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const data = await api.getConversations();
      setConversations(data || []);
      if (data && data.length > 0 && !activeConv) {
        setActiveConv(data[0]);
      }
    } catch (err) {
      addToast('Failed to load conversations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId) => {
    if (!convId) return;
    try {
      const msgs = await api.getMessages(convId);
      setMessages(msgs || []);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeConv) {
      fetchMessages(activeConv.id);
    }
  }, [activeConv]);

  // Handle incoming realtime message for active conversation
  useEffect(() => {
    if (realtimeMsgs && realtimeMsgs.length > 0) {
      const latest = realtimeMsgs[realtimeMsgs.length - 1];
      if (latest && activeConv && latest.conversationId === activeConv.id) {
        setMessages(prev => [...prev, latest]);
        setTimeout(scrollToBottom, 100);
      }
    }
  }, [realtimeMsgs, activeConv]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!textInput.trim() || !activeConv) return;

    try {
      const newMsg = await api.sendMessage(activeConv.id, {
        type: 'text',
        content: textInput.trim()
      });
      setMessages(prev => [...prev, newMsg]);
      setTextInput('');
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      addToast('Failed to send message', 'error');
    }
  };

  const handleSendVoiceNote = async (audioBlob, durationSec) => {
    if (!activeConv) return;
    try {
      // In our mock/demo environment or with API, send voice note message
      const audioUrl = URL.createObjectURL(audioBlob);
      const newMsg = await api.sendMessage(activeConv.id, {
        type: 'voice',
        audioUrl: audioUrl,
        duration: durationSec,
        content: `Voice Note (${Math.floor(durationSec)}s)`
      });
      setMessages(prev => [...prev, newMsg]);
      setIsRecordingVoice(false);
      addToast('Voice note sent!', 'success');
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      addToast('Failed to send voice note', 'error');
    }
  };

  const handleDeleteMessage = async (msgId) => {
    try {
      await api.deleteMessage(msgId);
      setMessages(prev => prev.filter(m => m.id !== msgId));
      addToast('Message deleted', 'success');
    } catch (err) {
      addToast('Failed to delete message', 'error');
    }
  };

  const filteredConversations = conversations.filter(c => 
    c.name?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Conversations & Channels */}
        <div className={`w-full md:w-80 border-r border-slate-800 flex flex-col bg-slate-950/70 ${activeConv && showChatOnMobile ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-400" />
              Chat & Channels
            </h2>
            <div className="relative mt-3">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search chats or staff..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
            {loading ? (
              <div className="p-6 text-center text-xs text-slate-500">Loading channels...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">No chats found.</div>
            ) : (
              filteredConversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => {
                    setActiveConv(conv);
                    setShowChatOnMobile(true);
                  }}
                  className={`w-full p-3.5 text-left flex items-start gap-3 transition ${
                    activeConv?.id === conv.id ? 'bg-indigo-600/15 border-l-4 border-indigo-500' : 'hover:bg-slate-900/60'
                  }`}
                >
                  {conv.type === 'channel' ? (
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400 font-bold">
                      <Hash className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="relative">
                      <img
                        src={conv.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100`}
                        alt={conv.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-700"
                      />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-950" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-white truncate">{conv.name}</p>
                      <span className="text-[10px] text-slate-500">{conv.lastMessageTime || ''}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {conv.lastMessage || 'No messages yet'}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Area: Active Chat */}
        {activeConv ? (
          <div className={`flex-1 flex flex-col bg-slate-900/50 ${showChatOnMobile ? 'flex' : 'hidden md:flex'}`}>
            {/* Chat Header */}
            <div className="p-3.5 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setShowChatOnMobile(false)}
                  className="md:hidden p-1.5 -ml-1 text-slate-400 hover:text-white rounded-lg transition"
                  title="Back to chats"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {activeConv.type === 'channel' ? (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <Hash className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                ) : (
                  <img
                    src={activeConv.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100`}
                    alt={activeConv.name}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-slate-700"
                  />
                )}
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-white">{activeConv.name}</h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-400">
                    {activeConv.type === 'channel' ? `${activeConv.participants?.length || 12} members` : 'Direct message'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsVideoCallActive(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition"
                >
                  <Video className="w-4 h-4" />
                  <span>Start Video Call</span>
                </button>
              </div>
            </div>

            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                  This is the beginning of your conversation in {activeConv.name}.
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.senderId === user?.id || msg.isMe;
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}
                    >
                      <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-white font-bold flex-shrink-0">
                        {msg.senderName ? msg.senderName.charAt(0) : 'U'}
                      </div>

                      <div className={`max-w-md rounded-2xl p-3.5 shadow-sm text-xs ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                      }`}>
                        <div className="flex items-center justify-between gap-4 mb-1">
                          <span className={`font-semibold text-[11px] ${isMe ? 'text-indigo-200' : 'text-indigo-400'}`}>
                            {isMe ? 'You' : msg.senderName}
                          </span>
                          <span className={`text-[10px] ${isMe ? 'text-indigo-200' : 'text-slate-500'}`}>
                            {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>

                        {/* Content Types: Voice Note vs Text */}
                        {msg.type === 'voice' || msg.audioUrl ? (
                          <div className="py-1">
                            <AudioMessagePlayer
                              audioUrl={msg.audioUrl}
                              duration={msg.duration || 12}
                              isMe={isMe}
                            />
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        )}

                        {/* Delete option */}
                        {isMe && (
                          <div className="mt-1 pt-1 flex justify-end">
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="text-[10px] opacity-60 hover:opacity-100 transition text-rose-300"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar or Voice Recorder */}
            <div className="p-3 bg-slate-950 border-t border-slate-800">
              {isRecordingVoice ? (
                <VoiceNoteRecorder
                  onSendVoice={handleSendVoiceNote}
                  onCancel={() => setIsRecordingVoice(false)}
                />
              ) : (
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => addToast('File upload ready', 'info')}
                    className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 transition"
                    title="Attach file"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={`Message ${activeConv.name}...`}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />

                  <button
                    type="button"
                    onClick={() => setIsRecordingVoice(true)}
                    className="p-2 text-indigo-400 hover:text-indigo-300 rounded-xl hover:bg-slate-900 transition"
                    title="Record voice note"
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  <button
                    type="submit"
                    disabled={!textInput.trim()}
                    className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl transition shadow"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
            Select a channel or direct message to start chatting.
          </div>
        )}
      </div>

      {/* Video Call Modal */}
      {isVideoCallActive && (
        <VideoCallModal
          isOpen={isVideoCallActive}
          onClose={() => setIsVideoCallActive(false)}
          partnerName={activeConv?.name || 'Team Member'}
        />
      )}
    </div>
  );
}
