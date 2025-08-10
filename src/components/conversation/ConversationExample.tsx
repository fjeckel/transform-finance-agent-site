import React, { useState } from 'react';
import {
  useConversationList,
  useConversationHistory,
  useConversationSync,
  useConversationSearch
} from '@/hooks/conversation';
import { ConversationService } from '@/services/conversation';
import type { AIProvider, MessageContent } from '@/types/conversation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Search, Pin, Archive, Trash2 } from 'lucide-react';

/**
 * Comprehensive example component demonstrating the conversation system
 * This shows how to integrate all the conversation services and hooks
 */
export function ConversationExample() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('claude');

  // Use conversation list hook
  const {
    conversations,
    isLoading: listLoading,
    error: listError,
    refresh: refreshList,
    togglePin,
    archiveConversation,
    deleteConversation
  } = useConversationList({
    filters: {},
    realTimeUpdates: true
  });

  // Use conversation history hook for active conversation
  const {
    conversation,
    messages,
    artifacts,
    isLoading: historyLoading,
    isSending,
    sendMessage,
    addReaction,
    editMessage,
    regenerateResponse,
    scrollToBottom,
    messagesEndRef
  } = useConversationHistory({
    conversationId: activeConversationId || '',
    realTimeUpdates: true
  });

  // Use real-time sync for presence and typing
  const {
    isConnected,
    onlineUsers,
    typingUsers,
    startTyping,
    stopTyping
  } = useConversationSync({
    conversationId: activeConversationId || '',
    autoConnect: true,
    onMessageReceived: (message) => {
      console.log('New message received:', message);
      scrollToBottom();
    }
  });

  // Use search hook
  const {
    results: searchResults,
    isSearching,
    search,
    clearSearch
  } = useConversationSearch({
    debounceMs: 300,
    maxResults: 20
  });

  // Handle creating new conversation
  const handleNewConversation = async () => {
    try {
      const conversationService = ConversationService.getInstance();
      const newConv = await conversationService.createConversation({
        title: 'New Research Chat',
        content: {
          text: 'Hello! I need help with financial research.'
        },
        conversationType: 'research'
      });
      
      setActiveConversationId(newConv.id);
      refreshList();
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  // Handle sending message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversationId || isSending) return;

    const content: MessageContent = {
      text: newMessage.trim()
    };

    try {
      await sendMessage(content, selectedProvider);
      setNewMessage('');
      stopTyping();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Handle message input changes
  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (e.target.value.length > 0) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      search(searchQuery.trim());
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Conversations</h2>
            <Button onClick={handleNewConversation} size="sm">
              New Chat
            </Button>
          </div>
          
          {/* Search */}
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </form>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {listLoading ? (
            <div className="p-4">
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            </div>
          ) : listError ? (
            <div className="p-4 text-red-600 text-sm">
              Error loading conversations: {listError.message}
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {conversations.map((conv) => (
                <Card
                  key={conv.id}
                  className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                    activeConversationId === conv.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setActiveConversationId(conv.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">{conv.title}</h3>
                        <p className="text-xs text-gray-500 truncate mt-1">{conv.preview}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {conv.messageCount} messages
                          </Badge>
                          {conv.totalCost && (
                            <Badge variant="outline" className="text-xs">
                              ${conv.totalCost.toFixed(4)}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        {conv.isPinned && <Pin className="h-3 w-3 text-blue-500" />}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePin(conv.id, !conv.isPinned);
                          }}
                        >
                          <Pin className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            archiveConversation(conv.id);
                          }}
                        >
                          <Archive className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(conv.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Connection Status */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-xs">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            {isConnected ? 'Connected' : 'Disconnected'}
            {onlineUsers.length > 0 && (
              <span className="text-gray-500">• {onlineUsers.length} online</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {activeConversationId ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-semibold">{conversation?.title}</h1>
                  {conversation?.description && (
                    <p className="text-sm text-gray-500">{conversation.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value as AIProvider)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="claude">Claude</option>
                    <option value="openai">OpenAI</option>
                    <option value="grok">Grok</option>
                  </select>
                  {typingUsers.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {typingUsers.length === 1 ? '1 person typing' : `${typingUsers.length} people typing`}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
              {historyLoading ? (
                <div className="flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="max-w-4xl mx-auto space-y-4">
                  {messages.map((message) => (
                    <Card
                      key={message.id}
                      className={`${
                        message.role === 'user' ? 'ml-auto bg-blue-50' : 'mr-auto'
                      } max-w-[80%]`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={message.role === 'user' ? 'default' : 'secondary'}>
                              {message.role}
                            </Badge>
                            {message.aiProvider && (
                              <Badge variant="outline" className="text-xs">
                                {message.aiProvider}
                              </Badge>
                            )}
                            {message.status === 'processing' && (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {message.createdAt.toLocaleTimeString()}
                          </div>
                        </div>
                        
                        <div className="prose prose-sm max-w-none">
                          {typeof message.content === 'string' 
                            ? message.content 
                            : message.content.text
                          }
                        </div>

                        {/* Message Actions */}
                        <div className="flex items-center gap-2 mt-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => addReaction(message.id, 'like')}
                          >
                            👍 {message.reactions?.filter(r => r.reactionType === 'like').length || 0}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => addReaction(message.id, 'dislike')}
                          >
                            👎 {message.reactions?.filter(r => r.reactionType === 'dislike').length || 0}
                          </Button>
                          {message.role === 'user' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => regenerateResponse(message.id)}
                            >
                              Regenerate
                            </Button>
                          )}
                        </div>

                        {/* Token and Cost Info */}
                        {message.totalTokens > 0 && (
                          <div className="text-xs text-gray-500 mt-2">
                            {message.totalTokens} tokens • ${message.costUsd.toFixed(4)} • {message.processingTimeMs}ms
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={handleMessageChange}
                  disabled={isSending}
                  className="flex-1"
                />
                <Button type="submit" disabled={!newMessage.trim() || isSending}>
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </>
        ) : (
          /* No Conversation Selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-4">Select a conversation</h2>
              <p className="text-gray-500 mb-6">Choose a conversation from the sidebar or create a new one</p>
              <Button onClick={handleNewConversation}>
                Start New Conversation
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Search Results Modal */}
      {searchResults.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Search Results</CardTitle>
                <Button variant="ghost" size="sm" onClick={clearSearch}>
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {searchResults.map((result, index) => (
                  <Card
                    key={`${result.conversation.id}-${index}`}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      setActiveConversationId(result.conversation.id);
                      clearSearch();
                    }}
                  >
                    <CardContent className="p-4">
                      <h3 className="font-medium mb-2">{result.conversation.title}</h3>
                      {result.matchingMessages.length > 0 && (
                        <div className="text-sm text-gray-600">
                          {result.matchingMessages.length} matching messages
                        </div>
                      )}
                      <Badge variant="outline" className="text-xs mt-2">
                        Score: {(result.relevanceScore * 10).toFixed(1)}/10
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}