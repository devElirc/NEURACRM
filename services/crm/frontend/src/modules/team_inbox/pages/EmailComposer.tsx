import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../../auth/AuthProvider";
import { EmailData, Message } from "../types";
import {
  Send,
  Paperclip,
  X,
  Minimize2,
  Maximize2,
  Bold,
  Italic,
  Underline,
  List,
  AlignLeft,
} from "lucide-react";
import { Button } from "./ui/Button";

interface EmailComposerProps {
  onSend: (emailData: EmailData) => void;
  onCancel: () => void;
  replyTo?: {
    threadId: string;
    subject: string;
    to: string[];
  };
  forwardMessage?: Message;
}

export function EmailComposer({
  onSend,
  onCancel,
  replyTo,
  forwardMessage,
}: EmailComposerProps) {
  const { user } = useAuth();
  const [to, setTo] = useState<string[]>(replyTo?.to || []);
  const [cc, setCc] = useState<string[]>([]);
  const [bcc, setBcc] = useState<string[]>([]);
  const [subject, setSubject] = useState(replyTo?.subject || "");
  const [content, setContent] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Prefill for forward
  useEffect(() => {
    if (forwardMessage) {
      setSubject(`Fwd: ${forwardMessage.subject}`);

      const forwardBlockHtml = `
        <div style="border-left:2px solid #ccc; margin:16px 0; padding-left:12px; color:#555;">
          <div style="font-size:13px; margin-bottom:8px;">
            ---------- Forwarded message ----------<br/>
            <b>From:</b> ${forwardMessage.from.name} &lt;${forwardMessage.from.email}&gt;<br/>
            <b>Date:</b> ${forwardMessage.timestamp.toLocaleString()}<br/>
            <b>Subject:</b> ${forwardMessage.subject}<br/>
            <b>To:</b> ${forwardMessage.to
          .map((t) => `${t.name} &lt;${t.email}&gt;`)
          .join(", ")}
          </div>
          <div>${forwardMessage.htmlContent || forwardMessage.content}</div>
        </div>
      `;

      const forwardBlockText = `
---------- Forwarded message ----------
From: ${forwardMessage.from.name} <${forwardMessage.from.email}>
Date: ${forwardMessage.timestamp.toLocaleString()}
Subject: ${forwardMessage.subject}
To: ${forwardMessage.to.map((t) => `${t.name} <${t.email}>`).join(", ")}

${forwardMessage.content}
      `;

      setContent((prev) =>
        prev ? `${prev}\n\n${forwardBlockText}` : forwardBlockText
      );
      setHtmlContent((prev) =>
        prev ? `${prev}<br/><br/>${forwardBlockHtml}` : forwardBlockHtml
      );

      if (forwardMessage.attachments?.length) {
        setAttachments(forwardMessage.attachments as unknown as File[]);
      }
    }
  }, [forwardMessage]);

  const handleSend = async () => {
    if (!to.length || !subject.trim() || !content.trim()) return;

    setIsSending(true);

    const emailData: EmailData = {
      to,
      cc,
      bcc,
      subject,
      content,
      htmlContent,
      attachments,
      isReply: !!replyTo,
      threadId: replyTo?.threadId,
    };

    try {
      await onSend(emailData);
    } catch (err) {
      console.error("Failed to send email:", err);
    } finally {
      setIsSending(false);
    }
  };

  const addRecipient = (field: "to" | "cc" | "bcc", email: string) => {
    if (!email.trim()) return;
    const setter = field === "to" ? setTo : field === "cc" ? setCc : setBcc;
    const current = field === "to" ? to : field === "cc" ? cc : bcc;
    if (!current.includes(email)) setter([...current, email]);
  };

  const removeRecipient = (field: "to" | "cc" | "bcc", email: string) => {
    const setter = field === "to" ? setTo : field === "cc" ? setCc : setBcc;
    const current = field === "to" ? to : field === "cc" ? cc : bcc;
    setter(current.filter((r) => r !== email));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const formatText = (command: string) => {
    document.execCommand(command, false);
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg w-80">
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            {replyTo ? "Reply" : forwardMessage ? "Forward" : "New Message"}
          </h3>
          <div className="flex items-center space-x-1">
            <button onClick={() => setIsMinimized(false)} className="p-1"><Maximize2 className="w-4 h-4" /></button>
            <button onClick={onCancel} className="p-1"><X className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="p-3">
          <p className="text-sm text-gray-600 dark:text-gray-300 truncate">To: {to.join(", ")}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300 truncate">Subject: {subject}</p>
        </div>
      </div>
    );
  }

//  return (
//     <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl flex flex-col ${isMaximized ? "fixed inset-4" : "w-full max-w-4xl"} max-h-[90vh]`}>
//       {/* Header */}
//       <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
//         <h3 className="text-lg font-medium text-gray-900 dark:text-white">
//           {replyTo ? "Reply" : forwardMessage ? "Forward" : "Compose Message"}
//         </h3>
//         <div className="flex items-center space-x-2">
//           <button onClick={() => setIsMinimized(true)} className="p-2"><Minimize2 className="w-4 h-4" /></button>
//           <button onClick={() => setIsMaximized(!isMaximized)} className="p-2"><Maximize2 className="w-4 h-4" /></button>
//           <button onClick={onCancel} className="p-2"><X className="w-4 h-4" /></button>
//         </div>
//       </div>

//       {/* Scrollable body */}
//       <div className="flex-1 overflow-y-auto p-4 space-y-3">
//         {/* Recipients */}
//         <div className="space-y-3">
//           <div className="flex items-center">
//             <label className="w-16 text-sm font-medium">From:</label>
//             <div className="flex-1"><span className="text-sm">{user?.full_name} &lt;{user?.email}&gt;</span></div>
//           </div>

//           <div className="flex items-start">
//             <label className="w-16 text-sm font-medium mt-2">To:</label>
//             <div className="flex-1">
//               <div className="flex flex-wrap gap-2 mb-2">
//                 {to.map((email,i)=>(
//                   <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
//                     {email}
//                     <button onClick={()=>removeRecipient("to",email)} className="ml-2"><X className="w-3 h-3" /></button>
//                   </span>
//                 ))}
//               </div>
//               <input type="email" placeholder="Enter email address" className="w-full px-3 py-2 border rounded-md text-sm"
//                 onKeyPress={(e)=>{if(e.key==="Enter"){addRecipient("to", e.currentTarget.value); e.currentTarget.value="";}}}/>
//               <div className="mt-2 flex items-center space-x-4">
//                 <button onClick={()=>setShowCc(!showCc)} className="text-sm text-blue-600">Cc</button>
//                 <button onClick={()=>setShowBcc(!showBcc)} className="text-sm text-blue-600">Bcc</button>
//               </div>
//             </div>
//           </div>

//           {showCc && <div className="flex items-start">
//             <label className="w-16 text-sm font-medium mt-2">Cc:</label>
//             <div className="flex-1">
//               {cc.map((email,i)=>(
//                 <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800">
//                   {email}<button onClick={()=>removeRecipient("cc",email)} className="ml-2"><X className="w-3 h-3"/></button>
//                 </span>
//               ))}
//               <input type="email" placeholder="Enter email address" className="w-full px-3 py-2 border rounded-md text-sm mt-2"
//                 onKeyPress={(e)=>{if(e.key==="Enter"){addRecipient("cc", e.currentTarget.value); e.currentTarget.value="";}}}/>
//             </div>
//           </div>}

//           {showBcc && <div className="flex items-start">
//             <label className="w-16 text-sm font-medium mt-2">Bcc:</label>
//             <div className="flex-1">
//               {bcc.map((email,i)=>(
//                 <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800">
//                   {email}<button onClick={()=>removeRecipient("bcc",email)} className="ml-2"><X className="w-3 h-3"/></button>
//                 </span>
//               ))}
//               <input type="email" placeholder="Enter email address" className="w-full px-3 py-2 border rounded-md text-sm mt-2"
//                 onKeyPress={(e)=>{if(e.key==="Enter"){addRecipient("bcc", e.currentTarget.value); e.currentTarget.value="";}}}/>
//             </div>
//           </div>}

//           <div className="flex items-center">
//             <label className="w-16 text-sm font-medium">Subject:</label>
//             <input type="text" value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Enter subject" className="flex-1 px-3 py-2 border rounded-md text-sm"/>
//           </div>
//         </div>

//         {/* Toolbar */}
//         <div className="flex items-center justify-between px-0 py-2 border-b bg-gray-50">
//           <div className="flex items-center space-x-2">
//             <button onClick={()=>formatText("bold")}><Bold className="w-4 h-4"/></button>
//             <button onClick={()=>formatText("italic")}><Italic className="w-4 h-4"/></button>
//             <button onClick={()=>formatText("underline")}><Underline className="w-4 h-4"/></button>
//             <button onClick={()=>formatText("insertUnorderedList")}><List className="w-4 h-4"/></button>
//             <button onClick={()=>formatText("justifyLeft")}><AlignLeft className="w-4 h-4"/></button>
//           </div>
//           <button onClick={()=>fileInputRef.current?.click()}><Paperclip className="w-4 h-4"/></button>
//         </div>

//         {/* Content */}
//         <div ref={contentRef} contentEditable className="w-full p-3 border rounded-md text-sm focus:outline-none min-h-[16rem]" style={{whiteSpace:"pre-wrap"}} onInput={(e)=>{
//           const target=e.currentTarget;
//           setContent(target.textContent||"");
//           setHtmlContent(target.innerHTML);
//         }} dangerouslySetInnerHTML={{__html: htmlContent}}/>

//         {/* Attachments */}
//         {attachments.length>0 && (
//           <div className="mt-4 space-y-2">
//             <h4 className="text-sm font-medium">Attachments</h4>
//             {attachments.map((file,index)=>(
//               <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
//                 <div className="flex items-center space-x-2"><Paperclip className="w-4 h-4 text-gray-400"/><span className="text-sm">{file.name}</span><span className="text-xs text-gray-500">({file.size} bytes)</span></div>
//                 <button onClick={()=>removeAttachment(index)} className="text-red-600"><X className="w-4 h-4"/></button>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Footer */}
//       <div className="flex-shrink-0 flex items-center justify-between p-4 border-t bg-gray-50">
//         <div className="flex items-center space-x-2">
//           <Button onClick={handleSend} disabled={!to.length || !subject.trim() || !content.trim()} isLoading={isSending}><Send className="w-4 h-4 mr-2"/>Send</Button>
//           <Button variant="outline" onClick={onCancel}>Cancel</Button>
//         </div>
//         <div className="text-xs text-gray-500">Press Ctrl+Enter to send</div>
//       </div>

//       <input ref={fileInputRef} type="file" multiple onChange={handleFileUpload} className="hidden"/>
//     </div>
//   );


return (
  <div
    className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl flex flex-col max-h-[90vh] ${isMaximized ? "fixed inset-4" : "w-full max-w-4xl"
      }`}
  >
    {/* Header */}
    <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
        {replyTo ? "Reply" : forwardMessage ? "Forward" : "Compose Message"}
      </h3>
      <div className="flex items-center space-x-2">
        <button onClick={() => setIsMinimized(true)} className="p-2">
          <Minimize2 className="w-4 h-4" />
        </button>
        <button onClick={() => setIsMaximized(!isMaximized)} className="p-2">
          <Maximize2 className="w-4 h-4" />
        </button>
        <button onClick={onCancel} className="p-2">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>

    {/* Recipients */}
    <div className="flex-shrink-0 p-4 space-y-3 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center">
        <label className="w-16 text-sm font-medium">From:</label>
        <div className="flex-1">
          <span className="text-sm">
            {user?.full_name} &lt;{user?.email}&gt;
          </span>
        </div>
      </div>

      {/* To */}
      <div className="flex items-start">
        <label className="w-16 text-sm font-medium mt-2">To:</label>
        <div className="flex-1">
          <div className="flex flex-wrap gap-2 mb-2">
            {to.map((email, i) => (
              <span
                key={i}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
              >
                {email}
                <button
                  onClick={() => removeRecipient("to", email)}
                  className="ml-2"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <input
            type="email"
            placeholder="Enter email address"
            className="w-full px-3 py-2 border rounded-md text-sm"
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                addRecipient("to", e.currentTarget.value);
                e.currentTarget.value = "";
              }
            }}
          />
          <div className="mt-2 flex items-center space-x-4">
            <button
              onClick={() => setShowCc(!showCc)}
              className="text-sm text-blue-600"
            >
              Cc
            </button>
            <button
              onClick={() => setShowBcc(!showBcc)}
              className="text-sm text-blue-600"
            >
              Bcc
            </button>
          </div>
        </div>
      </div>

      {/* CC */}
      {showCc && (
        <div className="flex items-start">
          <label className="w-16 text-sm font-medium mt-2">Cc:</label>
          <div className="flex-1">
            {cc.map((email, i) => (
              <span
                key={i}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
              >
                {email}
                <button
                  onClick={() => removeRecipient("cc", email)}
                  className="ml-2"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <input
              type="email"
              placeholder="Enter email address"
              className="w-full px-3 py-2 border rounded-md text-sm mt-2"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  addRecipient("cc", e.currentTarget.value);
                  e.currentTarget.value = "";
                }
              }}
            />
          </div>
        </div>
      )}

      {/* BCC */}
      {showBcc && (
        <div className="flex items-start">
          <label className="w-16 text-sm font-medium mt-2">Bcc:</label>
          <div className="flex-1">
            {bcc.map((email, i) => (
              <span
                key={i}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
              >
                {email}
                <button
                  onClick={() => removeRecipient("bcc", email)}
                  className="ml-2"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <input
              type="email"
              placeholder="Enter email address"
              className="w-full px-3 py-2 border rounded-md text-sm mt-2"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  addRecipient("bcc", e.currentTarget.value);
                  e.currentTarget.value = "";
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Subject */}
      <div className="flex items-center">
        <label className="w-16 text-sm font-medium">Subject:</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Enter subject"
          className="flex-1 px-3 py-2 border rounded-md text-sm"
        />
      </div>
    </div>

    {/* Toolbar */}
    <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b bg-gray-50">
      <div className="flex items-center space-x-2">
        <button onClick={() => formatText("bold")}>
          <Bold className="w-4 h-4" />
        </button>
        <button onClick={() => formatText("italic")}>
          <Italic className="w-4 h-4" />
        </button>
        <button onClick={() => formatText("underline")}>
          <Underline className="w-4 h-4" />
        </button>
        <button onClick={() => formatText("insertUnorderedList")}>
          <List className="w-4 h-4" />
        </button>
        <button onClick={() => formatText("justifyLeft")}>
          <AlignLeft className="w-4 h-4" />
        </button>
      </div>
      <button onClick={() => fileInputRef.current?.click()}>
        <Paperclip className="w-4 h-4" />
      </button>
    </div>

    {/* Content & Attachments */}
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div
        ref={contentRef}
        contentEditable
        className="w-full p-3 border rounded-md text-sm focus:outline-none"
        style={{
          whiteSpace: "pre-wrap",
          minHeight: "16rem",
          maxHeight: "32rem",
        }}
        onInput={(e) => {
          const target = e.currentTarget;
          setContent(target.textContent || "");
          setHtmlContent(target.innerHTML);
        }}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />

      {attachments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Attachments</h4>
          {attachments.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
            >
              <div className="flex items-center space-x-2">
                <Paperclip className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{file.name}</span>
                <span className="text-xs text-gray-500">({file.size} bytes)</span>
              </div>
              <button
                onClick={() => removeAttachment(index)}
                className="text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Footer */}
    <div className="flex-shrink-0 flex items-center justify-between p-4 border-t bg-gray-50">
      <div className="flex items-center space-x-2">
        <Button
          onClick={handleSend}
          disabled={!to.length || !subject.trim() || !content.trim()}
          isLoading={isSending}
        >
          <Send className="w-4 h-4 mr-2" />
          Send
        </Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
      <div className="text-xs text-gray-500">Press Ctrl+Enter to send</div>
    </div>

    <input
      ref={fileInputRef}
      type="file"
      multiple
      onChange={handleFileUpload}
      className="hidden"
    />
  </div>
);


}
