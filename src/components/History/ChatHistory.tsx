import React from 'react';
import { MessageSquare, Plus, Trash2, CreditCard as Edit2, Check, X, Clock } from 'lucide-react';
import { ChatSession } from '../../types';
import { historyService } from '../../services/historyService';

interface ChatHistoryProps {
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({
  currentSessionId,
  onSelectSession,
  onNewChat,
}) => {
  const [sessions, setSessions] = React.useState<ChatSession[]>([]);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await historyService.getChatSessions();
      setSessions(data);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this chat session?')) return;

    try {
      await historyService.deleteChatSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        onNewChat();
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const startEdit = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const saveEdit = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editTitle.trim()) return;

    try {
      await historyService.updateChatSessionTitle(sessionId, editTitle);
      setSessions(prev =>
        prev.map(s => (s.id === sessionId ? { ...s, title: editTitle } : s))
      );
      setEditingId(null);
    } catch (error) {
      console.error('Failed to update title:', error);
    }
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditTitle('');
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const groupedSessions = React.useMemo(() => {
    const groups: Record<string, ChatSession[]> = {
      Today: [],
      Yesterday: [],
      'Last 7 Days': [],
      'Last 30 Days': [],
      Older: [],
    };

    const now = new Date();
    sessions.forEach(session => {
      const diff = now.getTime() - session.updatedAt.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (days === 0) groups.Today.push(session);
      else if (days === 1) groups.Yesterday.push(session);
      else if (days < 7) groups['Last 7 Days'].push(session);
      else if (days < 30) groups['Last 30 Days'].push(session);
      else groups.Older.push(session);
    });

    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  }, [sessions]);

  return (
    <div className="w-80 border-r border-neutral-200 bg-neutral-50 flex flex-col h-full">
      <div className="p-4 border-b border-neutral-200 bg-white">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-xl font-medium shadow-soft hover:shadow-glow transition-all duration-300 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>New Chat</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-primary">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-sm text-neutral-500">No chat history yet</p>
            <p className="text-xs text-neutral-400 mt-1">Start a conversation to see it here</p>
          </div>
        ) : (
          groupedSessions.map(([groupName, groupSessions]) => (
            <div key={groupName}>
              <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 px-2">
                {groupName}
              </h3>
              <div className="space-y-1">
                {groupSessions.map(session => (
                  <div
                    key={session.id}
                    onClick={() => onSelectSession(session.id)}
                    className={`group relative rounded-xl p-3 cursor-pointer transition-all duration-200 ${
                      currentSessionId === session.id
                        ? 'bg-white shadow-soft border border-primary-200'
                        : 'hover:bg-white hover:shadow-sm'
                    }`}
                  >
                    {editingId === session.id ? (
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          className="flex-1 px-2 py-1 text-sm border border-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                          autoFocus
                        />
                        <button
                          onClick={e => saveEdit(session.id, e)}
                          className="p-1 hover:bg-primary-100 rounded transition-colors"
                        >
                          <Check className="w-4 h-4 text-primary-600" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1 hover:bg-neutral-100 rounded transition-colors"
                        >
                          <X className="w-4 h-4 text-neutral-600" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="text-sm font-medium text-neutral-900 line-clamp-2 flex-1">
                            {session.title}
                          </h4>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={e => startEdit(session, e)}
                              className="p-1 hover:bg-neutral-100 rounded transition-colors"
                              title="Rename"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-neutral-600" />
                            </button>
                            <button
                              onClick={e => handleDelete(session.id, e)}
                              className="p-1 hover:bg-red-100 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-600" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-neutral-500">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {session.messageCount} messages
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(session.updatedAt)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
