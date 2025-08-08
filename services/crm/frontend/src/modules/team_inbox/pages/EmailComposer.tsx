import React, { useState, useRef } from 'react';
import { useAuth } from '../../../auth/AuthProvider'
import {
  Send,
  Paperclip,
  Image,
  Smile,
  AtSign,
  X,
  Bold,
  Italic,
  Underline,
  Link,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Code,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface EmailComposerProps {
  to?: string;
  subject?: string;
  onSend: (emailData: EmailData) => void;
  onCancel: () => void;
  isReply?: boolean;
  threadId?: string;
}

interface EmailData {
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  content: string;
  htmlContent: string;
  attachments: File[];
  isReply: boolean;
  threadId?: string;
}

export function EmailComposer({
  to = '',
  subject = '',
  onSend,
  onCancel,
  isReply = false,
  threadId
}: EmailComposerProps) {
  const { user } = useAuth();
  // const [formData, setFormData] = useState({
  //   to: to,
  //   cc: '',
  //   bcc: '',
  //   subject: isReply && !subject.startsWith('Re:') ? `Re: ${subject}` : subject,
  //   content: '',
  //   htmlContent: ''
  // });

  const [formData, setFormData] = useState({
    to: to || 'develirc@gmail.com',
    cc: '',
    bcc: '',
    subject: isReply && !subject.startsWith('Re:') ? `Re: ${subject}` : (subject || 'Test Subject'),
    content: 'Hello,\n\nThis is a default message.',
    htmlContent: '<p>Hello,<br><br>This is a default message.</p>'
  });

  const [showCcBcc, setShowCcBcc] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleSend = async () => {
    if (!formData.to.trim() || !formData.content.trim()) return;

    setIsSending(true);

    try {
      const emailData: EmailData = {
        to: formData.to.split(',').map(email => email.trim()).filter(Boolean),
        cc: formData.cc.split(',').map(email => email.trim()).filter(Boolean),
        bcc: formData.bcc.split(',').map(email => email.trim()).filter(Boolean),
        subject: formData.subject,
        content: formData.content,
        htmlContent: contentRef.current?.innerHTML || formData.content,
        attachments,
        isReply,
        threadId
      };

      console.log("send")

      await onSend(emailData);
    } catch (error) {
      console.error('Failed to send email:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileAttachment = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const insertSignature = () => {
    const signature = user?.signature || `\n\nBest regards,\n${user?.full_name}\n${user?.company}`;
    setFormData(prev => ({
      ...prev,
      content: prev.content + signature
    }));
  };

  return (
    <div className={`bg-white border rounded-lg shadow-lg ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            {isReply ? 'Reply' : 'New Message'}
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              {isFullscreen ? (
                <Minimize2 className="h-5 w-5" />
              ) : (
                <Maximize2 className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* From Field */}
        <div className="flex items-center space-x-3">
          <label className="text-sm font-medium text-gray-700 w-12">From:</label>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-900">{user?.email}</span>
              <span className="text-xs text-gray-500">({user?.full_name})</span>
            </div>
          </div>
        </div>

        {/* To Field */}
        <div className="flex items-center space-x-3">
          <label className="text-sm font-medium text-gray-700 w-12">To:</label>
          <input
            type="text"
            value={formData.to}
            onChange={(e) => setFormData(prev => ({ ...prev, to: e.target.value }))}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="recipient@example.com"
          />
          {!showCcBcc && (
            <button
              onClick={() => setShowCcBcc(true)}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              Cc/Bcc
            </button>
          )}
        </div>

        {/* CC/BCC Fields */}
        {showCcBcc && (
          <>
            <div className="flex items-center space-x-3">
              <label className="text-sm font-medium text-gray-700 w-12">Cc:</label>
              <input
                type="text"
                value={formData.cc}
                onChange={(e) => setFormData(prev => ({ ...prev, cc: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="cc@example.com"
              />
            </div>
            <div className="flex items-center space-x-3">
              <label className="text-sm font-medium text-gray-700 w-12">Bcc:</label>
              <input
                type="text"
                value={formData.bcc}
                onChange={(e) => setFormData(prev => ({ ...prev, bcc: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="bcc@example.com"
              />
            </div>
          </>
        )}

        {/* Subject Field */}
        <div className="flex items-center space-x-3">
          <label className="text-sm font-medium text-gray-700 w-12">Subject:</label>
          <input
            type="text"
            value={formData.subject}
            onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter subject"
          />
        </div>

        {/* Formatting Toolbar */}
        <div className="border-t border-b border-gray-200 py-2">
          <div className="flex items-center space-x-1">
            <button className="p-2 hover:bg-gray-100 rounded transition-colors">
              <Bold className="h-4 w-4 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded transition-colors">
              <Italic className="h-4 w-4 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded transition-colors">
              <Underline className="h-4 w-4 text-gray-600" />
            </button>
            <div className="w-px h-6 bg-gray-300 mx-2" />
            <button className="p-2 hover:bg-gray-100 rounded transition-colors">
              <AlignLeft className="h-4 w-4 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded transition-colors">
              <AlignCenter className="h-4 w-4 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded transition-colors">
              <AlignRight className="h-4 w-4 text-gray-600" />
            </button>
            <div className="w-px h-6 bg-gray-300 mx-2" />
            <button className="p-2 hover:bg-gray-100 rounded transition-colors">
              <List className="h-4 w-4 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded transition-colors">
              <ListOrdered className="h-4 w-4 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded transition-colors">
              <Quote className="h-4 w-4 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded transition-colors">
              <Link className="h-4 w-4 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded transition-colors">
              <Code className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div>
          <div
            ref={contentRef}
            contentEditable
            className="w-full min-h-[200px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            style={{ whiteSpace: 'pre-wrap' }}
            onInput={(e) => {
              const target = e.target as HTMLDivElement;
              setFormData(prev => ({
                ...prev,
                content: target.textContent || '',
                htmlContent: target.innerHTML
              }));
            }}
          // placeholder="Type your message..."
          />
        </div>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="border border-gray-200 rounded-md p-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Attachments ({attachments.length})</h4>
            <div className="space-y-2">
              {attachments.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <Paperclip className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                  </div>
                  <button
                    onClick={() => removeAttachment(index)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileAttachment}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Attach files"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors" title="Insert image">
            <Image className="h-4 w-4" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors" title="Insert emoji">
            <Smile className="h-4 w-4" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors" title="Mention someone">
            <AtSign className="h-4 w-4" />
          </button>
          <button
            onClick={insertSignature}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            Insert signature
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!formData.to.trim() || !formData.content.trim() || isSending}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}