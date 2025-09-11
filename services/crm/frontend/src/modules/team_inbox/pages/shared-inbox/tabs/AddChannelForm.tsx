import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "../../../pages/ui/Button";
import { Globe } from "lucide-react";

type ProviderType = "gmail" | "outlook" | "custom";

export interface ChannelFormData {
  provider: ProviderType;
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

const OAUTH_CONFIG: Record<Exclude<ProviderType, "custom">, any> = {
  gmail: {
    clientId:
      "36730104363-751i7av8q3dskom7rrirst9kfai98toc.apps.googleusercontent.com",
    scope:
      "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    callbackPath: "/google-callback.html",
  },
  outlook: {
    clientId: "b405158e-cfe4-49a5-a294-d259d400ef27",
    scope:
      "openid offline_access https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send User.Read",
    authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    callbackPath: "/outlook-callback.html",
  },
};

/** Provider selector buttons */
const ProviderSelector: React.FC<{
  selected: ProviderType;
  onSelect: (provider: ProviderType) => void;
}> = ({ selected, onSelect }) => (
  <div className="flex space-x-4">
    {(["gmail", "outlook", "custom"] as const).map((id) => (
      <button
        key={id}
        type="button"
        onClick={() => onSelect(id)}
        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
          selected === id
            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
        }`}
      >
        <Globe className="w-4 h-4 inline-block mr-2" />
        {id === "custom" ? "Custom (IMAP/SMTP)" : id[0].toUpperCase() + id.slice(1)}
      </button>
    ))}
  </div>
);

/** Fields for custom IMAP/SMTP provider */
const CustomProviderFields: React.FC<{
  formData: ChannelFormData;
  setFormData: React.Dispatch<React.SetStateAction<ChannelFormData>>;
}> = ({ formData, setFormData }) => (
  <div className="space-y-4">
    <input
      type="email"
      placeholder="Email"
      value={formData.identifier}
      onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
      className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
    />
    {(
      ["imapHost", "imapPort", "smtpHost", "smtpPort", "username", "password"] as const
    ).map((field) => (
      <input
        key={field}
        type={field === "password" ? "password" : "text"}
        placeholder={field
          .charAt(0)
          .toUpperCase()
          .concat(field.slice(1).replace(/([A-Z])/g, " $1"))}
        value={formData[field] || ""}
        onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
        className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
      />
    ))}
  </div>
);

export default function AddChannelForm({ onSubmit, onCancel }: AddChannelFormProps) {
  const [formData, setFormData] = useState<ChannelFormData>({
    provider: "gmail",
    identifier: "",
  });

  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const popupRef = useRef<Window | null>(null);

  /** OAuth postMessage listener */
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      const { status, identifier } = event.data || {};
      if (!status) return;

      if (status.endsWith("_connected")) {
        setConnectionStatus("Connected successfully!");
        setFormData((prev) => ({ ...prev, identifier }));

        try {
          onSubmit({ ...formData, identifier });  
        } catch (err) {
          setConnectionStatus("Team Inbox creation failed.");
        }
      } else if (status.endsWith("_failed")) {
        setConnectionStatus("Connection failed.");
      }

      if (popupRef.current && !popupRef.current.closed) popupRef.current.close();
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [formData, onSubmit]);

  /** OAuth popup handler */
  const handleOAuthConnect = useCallback(() => {
    const inboxName = JSON.parse(localStorage.getItem("selected_inbox_name") || '""');
    const inboxId = JSON.parse(localStorage.getItem("selected_inbox_id") || '""');

    const config = OAUTH_CONFIG[formData.provider as Exclude<ProviderType, "custom">];
    if (!config) return;

    setConnectionStatus("Connecting...");

    const redirectUri = `${window.location.origin}${config.callbackPath}`;
    const stateObj = { provider: formData.provider, inboxName, inboxId };

    const params: Record<string, string> = {
      client_id: config.clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: config.scope,
      state: encodeURIComponent(JSON.stringify(stateObj)),
    };

    if (formData.provider === "gmail") {
      params.access_type = "offline";
      params.prompt = "consent";
    }

    if (formData.provider === "outlook") {
      params.response_mode = "query";
      params.prompt = "consent";
    }

    const url = `${config.authUrl}?${new URLSearchParams(params).toString()}`;

    popupRef.current = window.open(url, "oauthPopup", "width=600,height=700");
    if (!popupRef.current) setConnectionStatus("Popup blocked. Please allow popups.");
  }, [formData.provider]);

  /** Handle Custom (IMAP/SMTP) submission */
  const handleCustomSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setConnectionStatus("Testing connection...");
      try {
        if (!formData.identifier)
          throw new Error("Email is required for custom provider");

        for (const field of [
          "imapHost",
          "imapPort",
          "smtpHost",
          "smtpPort",
          "username",
          "password",
        ]) {
          if (!formData[field as keyof ChannelFormData]) {
            throw new Error("All fields are required for custom provider");
          }
        }

        // Simulated connection
        await new Promise((res) => setTimeout(res, 800));
        setConnectionStatus("Connected successfully!");
        onSubmit(formData);   // ✅ pass full ChannelFormData
        onCancel();
      } catch (err) {
        setConnectionStatus((err as Error).message);
      }
    },
    [formData, onSubmit, onCancel]
  );

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg w-full">
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Add Email Channel
        </h2>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      <div className="p-6 space-y-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Provider
        </label>
        <ProviderSelector
          selected={formData.provider}
          onSelect={(provider) =>
            setFormData({ provider, identifier: "" })
          }
        />

        {formData.provider === "custom" && (
          <CustomProviderFields formData={formData} setFormData={setFormData} />
        )}

        {connectionStatus && (
          <div
            className={`text-sm ${
              connectionStatus.includes("success")
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {connectionStatus}
          </div>
        )}

        <div className="flex items-center justify-end space-x-3">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          {formData.provider === "custom" ? (
            <Button type="button" onClick={handleCustomSubmit}>
              Connect
            </Button>
          ) : (
            <Button type="button" onClick={handleOAuthConnect}>
              Connect with{" "}
              {formData.provider === "gmail" ? "Google" : "Microsoft"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
