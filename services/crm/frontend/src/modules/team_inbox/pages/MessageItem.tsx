import React, { useState } from 'react';
import { Message, Comment, EmailData } from '../types';
import { useAuth } from '../../../auth/AuthProvider';
import { CommentSection } from './CommentSection';
import { AIReplyPanel } from './AIReplyPanel';
import { InlineReplyComposer } from './InlineReplyComposer';
import {
  Reply,
  ReplyAll,
  Forward,
  Star,
  MoreHorizontal,
  Paperclip,
  MessageSquare,
  Bot,
  ChevronDown,
  ChevronUp,
  Quote
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from './ui/Button';

interface MessageItemProps {
  conversationId: string;
  message: Message;
  conversationMessages: Message[];
  isExpanded: boolean;
  isLastMessage: boolean;
  onToggleExpansion: (messageId: string) => void;
  onReply: (messageId: string, content: string, isReplyAll?: boolean) => void;
  onForward: (message: Message) => void;
  onAddComment: (messageId: string, content: string, attachments?: File[], mentions?: string[]) => void;
  comments: Comment[];
  onSendEmail: (emailData: EmailData) => void;
}

export function MessageItem({
  conversationId,
  message,
  conversationMessages,
  isExpanded,
  isLastMessage,
  onToggleExpansion,
  onReply,
  onForward,
  onAddComment,
  comments,
  onSendEmail
}: MessageItemProps) {
  const { user } = useAuth();
  const [showReplyComposer, setShowReplyComposer] = useState(false);
  const [showAiReply, setShowAiReply] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showPreviousMessage, setShowPreviousMessage] = useState(false);
  const [commentsCollapsed, setCommentsCollapsed] = useState(false);

  const isOutgoing = message.source === 'outgoing';
  const messageComments = comments.filter(comment => comment.messageId === message.id);


  // Previous message logic
  const previousMessage = message.inReplyTo
    ? conversationMessages.find(msg => msg.id === message.inReplyTo)
    : null;

  const handleReply = (content: string) => {
    if (content.trim()) onReply(message.id, content, false);
    setShowReplyComposer(false);
  };

  const handleReplyAll = (content: string) => {
    if (content.trim()) onReply(message.id, content, true);
    setShowReplyComposer(false);
  };

  const handleAiReply = (content: string) => {
    onReply(message.id, content, false);
    setShowAiReply(false);
  };

  const handleAddComment = (content: string, attachments?: File[], mentions?: string[]) => {
    onAddComment(message.id, content, attachments, mentions);
    if (!showComments) {
      setShowComments(true);
      setCommentsCollapsed(false);
    }
  };

  return (
    <div className={`border rounded-lg ${isOutgoing ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20' : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'}`}>
      
      {/* Message Header */}
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
        onClick={() => !isLastMessage && onToggleExpansion(message.id)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${isOutgoing ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-300'}`}>
              {(message.from.name || message.from.email).charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900 dark:text-white">
                  {message.from.name || message.from.email}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {isOutgoing ? 'replied' : 'wrote'}
                </span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {format(new Date(message.timestamp), 'MMM d, yyyy  h:mm a')}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {message.attachments.length > 0 && <Paperclip className="w-4 h-4 text-gray-400" />}
            {messageComments.length > 0 && (
              <div className="flex items-center space-x-1">
                <MessageSquare className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400">{messageComments.length}</span>
              </div>
            )}
            {!isLastMessage && (
              <div className="flex items-center space-x-1">
                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {isExpanded ? 'Collapse' : 'Expand'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message Content */}
      {(isExpanded || isLastMessage) && (
        <div className="px-4 pb-4">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {/* Main message HTML */}
            <div
              className=" text-gray-900 dark:text-white p-4"
              dangerouslySetInnerHTML={{ __html: message.htmlContent || message.content }}
            ></div>
          </div>

          {/* Attachments */}
          {message.attachments.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">Attachments</h4>
              {message.attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <Paperclip className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-900 dark:text-white">{attachment.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">({attachment.size} bytes)</span>
                </div>
              ))}
            </div>
          )}

          {/* Previous Message Display */}
          {showPreviousMessage && previousMessage && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <Quote className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Previous message from {previousMessage.from.name || previousMessage.from.email}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {format(new Date(previousMessage.timestamp), 'MMM d, yyyy  h:mm a')}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400  bg-white dark:bg-gray-700 p-3 rounded border">
                {/* Render previous message HTML */}
                <div
                  dangerouslySetInnerHTML={{ __html: previousMessage.htmlContent || previousMessage.content }}
                ></div>
              </div>
            </div>
          )}

          {/* Message Actions */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={() => setShowReplyComposer(!showReplyComposer)}>
                <Reply className="w-4 h-4 mr-2" /> Reply
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowAiReply(!showAiReply)}>
                <Bot className="w-4 h-4 mr-2" /> AI Reply
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowReplyComposer(true)}>
                <ReplyAll className="w-4 h-4 mr-2" /> Reply All
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onForward(message)}>
                <Forward className="w-4 h-4 mr-2" /> Forward
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Star className="w-4 h-4" />
              </Button>
              {previousMessage && (
                <Button variant="ghost" size="sm" onClick={() => setShowPreviousMessage(!showPreviousMessage)}>
                  <Quote className="w-4 h-4 mr-2" />
                  {showPreviousMessage ? 'Hide' : 'Show'} Previous
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setShowComments(!showComments)}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Comment ({messageComments.length})
              </Button>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Inline Reply Composer */}
          {showReplyComposer && (
            <div className="mt-4">
              <InlineReplyComposer
                onSend={handleReply}
                onSendReplyAll={handleReplyAll}
                onCancel={() => setShowReplyComposer(false)}
                replyTo={message}
                placeholder="Write your reply..."
                showReplyAllButton={true}
              />
            </div>
          )}

          {/* AI Reply Panel */}
          {showAiReply && (
            <div className="mt-4">
              <AIReplyPanel
                conversationId={conversationId}
                message={message}
                onSendReply={handleAiReply}
                onClose={() => setShowAiReply(false)}
              />
            </div>
          )}
        </div>
      )}

      {/* Comments Section */}
      {showComments && (
        <CommentSection
          comments={messageComments}
          onAddComment={handleAddComment}
          isCollapsed={commentsCollapsed}
          onToggleCollapse={() => setCommentsCollapsed(!commentsCollapsed)}
        />
      )}
    </div>
  );
}
