import React, { useState, useEffect } from 'react';
import { History, Trash2, MessageSquare, X } from 'lucide-react';
import { dbManager, ChatSession } from '../../utils/indexedDB';
import { useTranslations } from 'next-intl';

interface ChatHistoryProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectSession: (sessionId: string) => void;
  currentSessionId?: string | null;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({ 
  isVisible, 
  onClose, 
  onSelectSession, 
  currentSessionId 
}) => {
  const t = useTranslations('HomePage');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isVisible) {
      loadChatSessions();
    }
  }, [isVisible]);

  const loadChatSessions = async () => {
    setIsLoading(true);
    try {
      const chatSessions = await dbManager.getChatSessions();
      setSessions(chatSessions);
    } catch (error) {
      console.error('Error loading chat sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await dbManager.deleteSession(sessionId);
      setSessions(prev => prev.filter(session => session.id !== sessionId));
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const sessionDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - sessionDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return sessionDate.toLocaleDateString();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-background)] rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-button-border-in)]">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[var(--color-text)]" />
            <h2 className="text-lg font-semibold text-[var(--color-text)]">Chat History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[var(--color-hover)] rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-[var(--color-text)]" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-[var(--color-text)]">Loading chat history...</div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <div className="text-[var(--color-text)] text-sm">No chat history yet</div>
            </div>
          ) : (
            <div className="p-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => {
                    onSelectSession(session.id);
                    onClose();
                  }}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors mb-2 ${
                    currentSessionId === session.id
                      ? 'bg-[var(--color-object-selected)]'
                      : 'hover:bg-[var(--color-hover)]'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[var(--color-text)] font-medium truncate">
                      {session.title}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(session.createdAt)}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    className="p-1 hover:bg-red-100 rounded transition-colors ml-2"
                    title="Delete session"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[var(--color-button-border-in)] text-xs text-gray-500 text-center">
          Chat history is automatically cleaned up after 7 days
        </div>
      </div>
    </div>
  );
};