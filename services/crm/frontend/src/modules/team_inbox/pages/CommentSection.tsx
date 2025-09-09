

import React, { useState, useRef, useEffect } from 'react';
import { Comment } from '../types';
import { Teammate } from '../types/teammate';
import {
  MessageSquare,
  Paperclip,
  Smile,
  Send,
  X,
  ChevronDown,
  ChevronUp,
  AtSign,
  Bold,
  Italic,
  Link,
  Code,
  Bell,
  Users
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from './ui/Button';

interface CommentSectionProps {
  comments: Comment[];
  teammates: Teammate[];
  onAddComment: (content: string, attachments?: File[], mentions?: string[]) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface MentionDropdownProps {
  query: string;
  teammates: Teammate[];
  onSelect: (member: Teammate) => void;
  onClose: () => void;
  position: { top: number; left: number };
  direction: 'up' | 'down'; // NEW
  activeIndex: number; // NEW
}

const MentionDropdown: React.FC<MentionDropdownProps> = ({
  query,
  teammates,
  onSelect,
  onClose,
  position,
  direction,
  activeIndex // NEW
}) => {
  const filteredMembers = teammates.filter(member =>
    member.fullName.toLowerCase().includes(query.toLowerCase()) ||
    member.email.toLowerCase().includes(query.toLowerCase())
  );

  if (filteredMembers.length === 0) return null;

  return (
    <div
      className=" bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-2 w-72 z-[60] max-h-64 overflow-y-auto"
      style={{
        top: direction === 'down' ? position.top : undefined,
        bottom: direction === 'up' ? window.innerHeight - position.top : undefined,
        left: position.left
      }}
    >
      <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
          <AtSign className="w-3 h-3" />
          <span>Mention team member</span>
        </div>
      </div>
      {filteredMembers.map((member, idx) => (
        <button
          key={member.userId}
          onClick={() => onSelect(member)}
          className={`w-full flex items-center space-x-3 px-4 py-3 transition-colors ${idx === activeIndex
            ? 'bg-blue-100 dark:bg-blue-900/40'
            : 'hover:bg-blue-50 dark:hover:bg-blue-900/20'
            }`}
        >
          {member.avatar ? (
            <img
              src={member.avatar}
              alt={member.fullName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {member.fullName.charAt(0)}
              </span>
            </div>
          )}
          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {member.fullName}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {member.email}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 capitalize">
              {member.role}
            </div>
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500">
            <Bell className="w-3 h-3" />
          </div>
        </button>
      ))}
    </div>
  );
};

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect, onClose }) => {
  const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '🔥', '💯', '💪', '👏', '🙌', '🎉', '🎊', '✨', '⭐', '🌟'
  ];

  return (
    <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4 w-80 z-50">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Add Emoji</h4>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-10 gap-1 max-h-48 overflow-y-auto">
        {emojis.map((emoji, index) => (
          <button
            key={index}
            onClick={() => onEmojiSelect(emoji)}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-lg transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export function CommentSection({
  comments,
  teammates,
  onAddComment,
  isCollapsed = false,
  onToggleCollapse
}: CommentSectionProps) {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [mentionDirection, setMentionDirection] = useState<'up' | 'down'>('down'); // NEW
  const [activeMentionIndex, setActiveMentionIndex] = useState(0); // NEW
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mentions, setMentions] = useState<string[]>([]);
  const [mentionedMembers, setMentionedMembers] = useState<Teammate[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const mentionRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight, 40)}px`;
    }
  }, [content]);

  // Close dropdowns when clicking outside


useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Node;

    // Emoji picker
    if (
      showEmojiPicker &&
      emojiRef.current &&
      !emojiRef.current.contains(target) &&
      !containerRef.current?.contains(target)
    ) {
      setShowEmojiPicker(false);
    }

    // Mention dropdown
    if (
      showMentionDropdown &&
      mentionRef.current &&
      !mentionRef.current.contains(target)
    ) {
      setShowMentionDropdown(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, [showEmojiPicker, showMentionDropdown]);


  // Detect dropdown direction
  useEffect(() => {
    if (showMentionDropdown && textareaRef.current) {
      const rect = textareaRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      setMentionDirection(spaceBelow < 200 && spaceAbove > spaceBelow ? 'up' : 'down');
    }
  }, [showMentionDropdown, mentionPosition]);


  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;

    setContent(value);
    setCursorPosition(cursorPos);

    // Check for @ mentions
    const textBeforeCursor = value.substring(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const query = mentionMatch[1];
      setMentionQuery(query);
      setShowMentionDropdown(true);
      setActiveMentionIndex(0); // reset highlight

      // Calculate position for mention dropdown
      const textarea = textareaRef.current;
      if (textarea) {
        const rect = textarea.getBoundingClientRect();
        const lineHeight = 20; // Approximate line height
        const lines = textBeforeCursor.split('\n').length;

        setMentionPosition({
          //  top: rect.top + (lines * lineHeight) + 25,
          top: rect.bottom,
          left: rect.left + 10
        });
      }
    } else {
      setShowMentionDropdown(false);
    }
  };
  // Keyboard navigation for mention dropdown
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showMentionDropdown) return;

      const filtered = teammates.filter(member =>
        member.fullName.toLowerCase().includes(mentionQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(mentionQuery.toLowerCase())
      );
      if (filtered.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveMentionIndex(prev => (prev + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveMentionIndex(prev => (prev - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const member = filtered[activeMentionIndex];
        if (member) handleMentionSelect(member);
      } else if (e.key === 'Escape') {
        setShowMentionDropdown(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showMentionDropdown, activeMentionIndex, teammates, mentionQuery]);

  const handleMentionSelect = (member: Teammate) => {
    const textBeforeCursor = content.substring(0, cursorPosition);
    const textAfterCursor = content.substring(cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const beforeMention = textBeforeCursor.substring(0, mentionMatch.index);
      const newContent = `${beforeMention}@${member.fullName} ${textAfterCursor}`;
      setContent(newContent);

      // Add to mentions and mentioned members
      if (!mentions.includes(member.userId)) {
        setMentions(prev => [...prev, member.userId]);
        setMentionedMembers(prev => [...prev, member]);
      }
    }

    setShowMentionDropdown(false);

    // Focus back to textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = cursorPosition + member.fullName.length + 1;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        setCursorPosition(newCursorPos);
      }
    }, 0);
  };

  const handleEmojiSelect = (emoji: string) => {
    const textBeforeCursor = content.substring(0, cursorPosition);
    const textAfterCursor = content.substring(cursorPosition);
    const newContent = `${textBeforeCursor}${emoji}${textAfterCursor}`;

    setContent(newContent);
    setShowEmojiPicker(false);

    // Focus back to textarea and set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = cursorPosition + emoji.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        setCursorPosition(newCursorPos);
      }
    }, 0);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const removeMentionedMember = (memberId: string) => {
    setMentions(prev => prev.filter(id => id !== memberId));
    setMentionedMembers(prev => prev.filter(member => member.userId !== memberId));

    // Remove mention from content
    const memberToRemove = mentionedMembers.find(m => m.userId === memberId);
    if (memberToRemove) {
      const newContent = content.replace(new RegExp(`@${memberToRemove.fullName}\\s?`, 'g'), '');
      setContent(newContent);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && attachments.length === 0) return;

    onAddComment(content, attachments, mentions);
    setContent('');
    setAttachments([]);
    setMentions([]);
    setMentionedMembers([]);
    setIsExpanded(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const insertFormatting = (format: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'code':
        formattedText = `\`${selectedText}\``;
        break;
      case 'link':
        formattedText = `[${selectedText}](url)`;
        break;
      default:
        return;
    }

    const newContent = content.substring(0, start) + formattedText + content.substring(end);
    setContent(newContent);

    // Focus and set cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + formattedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const renderCommentContent = (commentContent: string, commentMentions?: string[]) => {
    if (!commentMentions || commentMentions.length === 0) {
      return commentContent;
    }

    let renderedContent = commentContent;

    // Replace mentions with styled spans
    commentMentions.forEach(mentionId => {
      const member = teammates.find(m => m.userId === mentionId);
      if (member) {
        const mentionRegex = new RegExp(`@${member.fullName}`, 'g');
        renderedContent = renderedContent.replace(
          mentionRegex,
          `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">@${member.fullName}</span>`
        );
      }
    });

    return <div dangerouslySetInnerHTML={{ __html: renderedContent }} />;
  };

  if (isCollapsed) {
    return (
      <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Comments ({comments.length})
            </span>
            {comments.some(c => c.mentions && c.mentions.length > 0) && (
              <div className="flex items-center space-x-1">
                <AtSign className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                <span className="text-xs text-blue-600 dark:text-blue-400">mentions</span>
              </div>
            )}
          </div>
          <ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Team Comments ({comments.length})
          </span>
          {comments.some(c => c.mentions && c.mentions.length > 0) && (
            <div className="flex items-center space-x-1">
              <AtSign className="w-3 h-3 text-blue-500 dark:text-blue-400" />
              <span className="text-xs text-blue-600 dark:text-blue-400">with mentions</span>
            </div>
          )}
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Comments List */}
      <div className="max-h-96 overflow-y-auto">
        {comments.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm font-medium mb-1">Start team collaboration</p>
            <p className="text-xs">Add comments and mention teammates with @</p>
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3 group">
                <div className="flex-shrink-0">
                  {comment.author.avatar ? (
                    <img
                      src={comment.author.avatar}
                      alt={comment.author.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {comment.author.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {comment.author.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDistanceToNow(comment.timestamp, { addSuffix: true })}
                      </span>
                      {comment.isInternal && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                          Internal
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {renderCommentContent(comment.content, comment.mentions)}
                    </div>

                    {/* Mentioned Members */}
                    {comment.mentions && comment.mentions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-2">
                          <Bell className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                          <span className="text-xs text-gray-500 dark:text-gray-400">Mentioned:</span>
                          <div className="flex items-center space-x-1">
                            {comment.mentions.map(mentionId => {
                              const member = teammates.find(m => m.userId === mentionId);
                              return member ? (
                                <span
                                  key={mentionId}
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                >
                                  {member.fullName}
                                </span>
                              ) : null;
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Attachments */}
                    {comment.attachments && comment.attachments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {comment.attachments.map((attachment, index) => (
                          <div key={index} className="flex items-center space-x-2 p-2 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                            <Paperclip className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900 dark:text-white">{attachment.name}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              ({formatFileSize(attachment.size)})
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comment Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Mentioned Members Display */}
          {mentionedMembers.length > 0 && (
            <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                Will notify:
              </span>
              <div className="flex items-center space-x-2">
                {mentionedMembers.map((member) => (
                  <div key={member.userId} className="flex items-center space-x-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                      @{member.fullName}
                      <button
                        type="button"
                        onClick={() => removeMentionedMember(member.userId)}
                        className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Toolbar */}
          {(isExpanded || content || attachments.length > 0 || mentionedMembers.length > 0) && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => insertFormatting('bold')}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Bold"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('italic')}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Italic"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('code')}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Code"
                >
                  <Code className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('link')}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Link"
                >
                  <Link className="w-4 h-4" />
                </button>
                <div className="h-4 border-l border-gray-300 dark:border-gray-600 mx-1"></div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Attach file"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    title="Add emoji"
                  >
                    <Smile className="w-4 h-4" />
                  </button>
                  {showEmojiPicker && (
                    <div ref={emojiRef}>
                      <EmojiPicker
                        onEmojiSelect={handleEmojiSelect}
                        onClose={() => setShowEmojiPicker(false)}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Use @ to mention teammates
              </div>
            </div>
          )}

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">Attachments</h4>
              {attachments.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center space-x-2">
                    <Paperclip className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-white">{file.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({formatFileSize(file.size)})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Text Input */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onFocus={() => setIsExpanded(true)}
              placeholder="Add a comment... Use @ to mention teammates"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none min-h-[44px] max-h-32"
              rows={1}
            />

            {/* Mention Dropdown */}
            {showMentionDropdown && (
              <div ref={mentionRef}>
                <MentionDropdown
                  query={mentionQuery}
                  teammates={teammates}
                  onSelect={handleMentionSelect}
                  onClose={() => setShowMentionDropdown(false)}
                  position={mentionPosition}
                  direction={mentionDirection}
                  activeIndex={activeMentionIndex}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          {(isExpanded || content || attachments.length > 0 || mentionedMembers.length > 0) && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <AtSign className="w-3 h-3" />
                  <span>@ mention</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Paperclip className="w-3 h-3" />
                  <span>attach files</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Smile className="w-3 h-3" />
                  <span>emoji</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setContent('');
                    setAttachments([]);
                    setMentions([]);
                    setMentionedMembers([]);
                    setIsExpanded(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!content.trim() && attachments.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Comment
                </Button>
              </div>
            </div>
          )}
        </form>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </div>
  );
}