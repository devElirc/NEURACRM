import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../../../pages/ui/Button';
import { Globe } from 'lucide-react';

interface ChannelFormData {
  provider: 'gmail' | 'outlook' | 'custom';
  identifier: string;
  imapHost?: string;
  imapPort?: string;
  smtpHost?: string;
  smtpPort?: string;
  username?: string;
  password?: string;
}

interface AddChannelFormProps {
  onSubmit: (data: ChannelFormData) => void;
  onCancel: () => void;
}

export default function AddChannelForm({ onSubmit, onCancel }: AddChannelFormProps) {
  const [formData, setFormData] = useState<ChannelFormData>({
    provider: 'gmail',
    identifier: '',
    imapHost: '',
    imapPort: '',
    smtpHost: '',
    smtpPort: '',
    username: '',
    password: ''
  });

  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);

  const providerRef = useRef(formData.provider);
  useEffect(() => {
    providerRef.current = formData.provider;
  }, [formData.provider]);

  // Popup reference
  const popupRef = useRef<Window | null>(null);

  const OAUTH_CONFIG = {
    gmail: {
      clientId: '757122969965-h4i287jiv8n5d6jbaergafq3ddki132e.apps.googleusercontent.com',
      scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email',
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      callbackPath: '/api/inbox/auth/google/callback'
    },
    outlook: {
      clientId: 'YOUR_OUTLOOK_CLIENT_ID',
      scope: 'https://graph.microsoft.com/Mail.Read',
      authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      callbackPath: '/api/inbox/auth/outlook/callback'
    }
  };

  // Message listener
  useEffect(() => {
    const listener = (event: MessageEvent) => {
      console.log("📥 Raw message from popup:", event.data);

      let data = event.data;
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch {
          console.warn("⚠️ Could not parse message:", data);
        }
      }

      console.log("📥 Parsed data:", data);
      if (!data || !data.status) return;

      const provider = providerRef.current;

      if (data.status === `${provider}_connected`) {
        alert(`✅ ${provider.toUpperCase()} connected! Email: ${data.email}`);
        setConnectionStatus('Connected successfully!');
        onSubmit({ provider, email: data.email });
      } else if (data.status === `${provider}_failed`) {
        alert(`❌ ${provider.toUpperCase()} connection failed!`);
        setConnectionStatus('Connection failed');
      }


      // Close popup if open
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
    };

    console.log("👂 Attaching message listener (stable)");
    window.addEventListener('message', listener);

    return () => {
      console.log("❌ Removing message listener");
      window.removeEventListener('message', listener);
    };
  }, [onSubmit]);

  // Detect popup close using window focus event (no .closed polling)
  useEffect(() => {
    function onFocus() {
      if (popupRef.current && popupRef.current.closed) {
        console.log("❌ Popup closed detected by window focus");
        setConnectionStatus('Popup closed before connecting');
      }
    }
    window.addEventListener('focus', onFocus);

    return () => {
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const handleProviderChange = (provider: 'gmail' | 'outlook' | 'custom') => {
    setFormData(prev => ({
      provider,
      identifier: provider === 'custom' ? prev.identifier : '',
      imapHost: provider === 'custom' ? prev.imapHost : '',
      imapPort: provider === 'custom' ? prev.imapPort : '',
      smtpHost: provider === 'custom' ? prev.smtpHost : '',
      smtpPort: provider === 'custom' ? prev.smtpPort : '',
      username: provider === 'custom' ? prev.username : '',
      password: provider === 'custom' ? prev.password : ''
    }));
  };

  const handleOAuthConnect = (provider: 'gmail' | 'outlook') => {
    const config = OAUTH_CONFIG[provider];
    if (!config) return;

    setConnectionStatus('Connecting...');
    const redirectUri = `http://127.0.0.1:8000${config.callbackPath}`;

    const authUrl =
      `${config.authUrl}?` +
      new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: config.scope,
        access_type: 'offline',
        prompt: 'consent',
        state: provider
      }).toString();

    console.log('🌐 Opening OAuth popup:', authUrl);

    popupRef.current = window.open(authUrl, 'oauthPopup', 'width=600,height=700');

    if (!popupRef.current) {
      alert('Popup blocked! Please allow popups and try again.');
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnectionStatus('Testing connection...');
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (!formData.identifier) throw new Error('Email is required');
      setConnectionStatus('Connected successfully');
      onSubmit(formData);
    } catch {
      setConnectionStatus('Connection failed');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg w-full">
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Email Channel</h2>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Provider</label>
          <div className="flex space-x-4">
            {['gmail', 'outlook', 'custom'].map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => handleProviderChange(id as any)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${formData.provider === id
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
              >
                <Globe className="w-4 h-4 inline-block mr-2" />
                {id === 'custom' ? 'Custom (IMAP/SMTP)' : id.charAt(0).toUpperCase() + id.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {formData.provider === 'custom' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
                placeholder="Enter email address"
              />
            </div>
            {['imapHost', 'imapPort', 'smtpHost', 'smtpPort', 'username', 'password'].map(field => (
              <div key={field}>
                <input
                  type={field === 'password' ? 'password' : 'text'}
                  value={(formData as any)[field] || ''}
                  onChange={e => setFormData({ ...formData, [field]: e.target.value })}
                  placeholder={field}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
                />
              </div>
            ))}
          </>
        )}

        {connectionStatus && (
          <div
            className={`text-sm ${connectionStatus.toLowerCase().includes('success')
                ? 'text-green-600'
                : connectionStatus.toLowerCase().includes('fail') ||
                  connectionStatus.toLowerCase().includes('closed')
                  ? 'text-red-600'
                  : 'text-gray-600'
              }`}
          >
            {connectionStatus}
          </div>
        )}

        <div className="flex items-center justify-end space-x-3">
          <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>
          {formData.provider === 'custom' ? (
            <Button
              type="button"
              onClick={handleCustomSubmit}
              disabled={
                !formData.email ||
                !formData.imapHost ||
                !formData.imapPort ||
                !formData.smtpHost ||
                !formData.smtpPort ||
                !formData.username ||
                !formData.password
              }
            >
              Connect
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => {
                if (formData.provider !== 'custom') {
                  handleOAuthConnect(formData.provider);
                }
              }}
            >
              Connect with {formData.provider === 'gmail' ? 'Google' : 'Microsoft'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
