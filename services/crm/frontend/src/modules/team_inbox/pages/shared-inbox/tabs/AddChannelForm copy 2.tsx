import React, { useState, useEffect, useRef } from 'react';

interface AddChannelFormProps {
  onSubmit: (data: { provider: string; email: string }) => void;
}

export default function AddChannelForm({ onSubmit }: AddChannelFormProps) {
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);

  const popupRef = useRef<Window | null>(null);
  const provider = 'gmail'; // For now only gmail, adapt if needed

  // OAuth config for Google
  const OAUTH_CONFIG = {
    gmail: {
      clientId: '757122969965-h4i287jiv8n5d6jbaergafq3ddki132e.apps.googleusercontent.com',
      scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email',
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      callbackPath: '/google-callback.html',
    },
  };


  // Listen for postMessage from popup callback page
  useEffect(() => {
    const listener = (event: MessageEvent) => {
      console.log('[Message Received]', {
        origin: event.origin,
        expected: window.location.origin,
        data: event.data,
      });

      if (event.origin !== window.location.origin) {
        console.warn('Origin mismatch');
        return;
      }

      const data = event.data;
      if (!data || !data.status) {
        console.warn('Invalid data format');
        return;
      }

      if (data.status === 'google_connected') {
        setConnectionStatus('Connected successfully!');
        setConnectedEmail(data.email);
        onSubmit({ provider, email: data.email });
      } else if (data.status === 'google_failed') {
        setConnectionStatus('Connection failed.');
        setConnectedEmail(null);
      }

      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
    };


    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [onSubmit]);

  const handleOAuthConnect = () => {
    const config = OAUTH_CONFIG[provider];
    if (!config) return;

    setConnectionStatus('Connecting...');
    setConnectedEmail(null);

    const redirectUri = `${window.location.origin}${config.callbackPath}`;

    const authUrl =
      `${config.authUrl}?` +
      new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: config.scope,
        access_type: 'offline',
        prompt: 'consent',
        state: provider,
      }).toString();

    popupRef.current = window.open(authUrl, 'oauthPopup', 'width=600,height=700');

    if (!popupRef.current) {
      alert('Popup blocked! Please allow popups and try again.');
      setConnectionStatus('Popup blocked');
    }
  };

  return (
    <div>
      <button onClick={handleOAuthConnect}>Connect with Google</button>
      {connectionStatus && <p>{connectionStatus}</p>}
      {connectedEmail && <p>Connected Email: {connectedEmail}</p>}
    </div>
  );
}
