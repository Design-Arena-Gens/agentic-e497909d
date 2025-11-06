"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type MessagingTag =
  | "CONFIRMED_EVENT_UPDATE"
  | "POST_PURCHASE_UPDATE"
  | "ACCOUNT_UPDATE"
  | "HUMAN_AGENT"
  | "CUSTOMER_FEEDBACK";

type Template = {
  id: string;
  name: string;
  text: string;
  tag: MessagingTag;
  ctaLabel?: string;
  ctaUrl?: string;
};

type SendLog = {
  id: string;
  recipientId: string;
  message: string;
  tag?: string;
  resultId?: string;
  timestamp: string;
};

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: "template-welcome",
    name: "Welcome Flow",
    text: "Hey {{first_name}}! Thanks for connecting with us. Here's a special welcome offer just for you.",
    tag: "ACCOUNT_UPDATE",
    ctaLabel: "Claim Offer",
    ctaUrl: "https://example.com/welcome"
  },
  {
    id: "template-abandoned",
    name: "Abandoned Cart Nudge",
    text: "Still thinking about {{product_name}}? It's waiting in your cart. Need any help to complete the order?",
    tag: "POST_PURCHASE_UPDATE"
  },
  {
    id: "template-feedback",
    name: "Feedback Request",
    text: "We hope your experience was amazing! Would you mind telling us how it went?",
    tag: "CUSTOMER_FEEDBACK",
    ctaLabel: "Leave Feedback",
    ctaUrl: "https://example.com/feedback"
  }
];

const STORAGE_KEYS = {
  templates: "instagram-auto-dm/templates",
  logs: "instagram-auto-dm/logs"
};

export default function Home() {
  const [templates, setTemplates] = useState<Template[]>(() => DEFAULT_TEMPLATES);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    DEFAULT_TEMPLATES[0]?.id ?? ""
  );
  const [recipientId, setRecipientId] = useState("");
  const [message, setMessage] = useState(DEFAULT_TEMPLATES[0]?.text ?? "");
  const [messagingTag, setMessagingTag] = useState<MessagingTag>(
    DEFAULT_TEMPLATES[0]?.tag ?? "ACCOUNT_UPDATE"
  );
  const [ctaLabel, setCtaLabel] = useState(DEFAULT_TEMPLATES[0]?.ctaLabel ?? "");
  const [ctaUrl, setCtaUrl] = useState(DEFAULT_TEMPLATES[0]?.ctaUrl ?? "");
  const [accessToken, setAccessToken] = useState("");
  const [senderId, setSenderId] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusVariant, setStatusVariant] = useState<"success" | "error" | null>(
    null
  );
  const [logs, setLogs] = useState<SendLog[]>([]);

  const [newTemplate, setNewTemplate] = useState({
    name: "",
    text: "",
    tag: "ACCOUNT_UPDATE" as MessagingTag,
    ctaLabel: "",
    ctaUrl: ""
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const savedTemplates = window.localStorage.getItem(STORAGE_KEYS.templates);
    if (savedTemplates) {
      try {
        const parsed: Template[] = JSON.parse(savedTemplates);
        if (parsed.length) {
          setTemplates(parsed);
          setSelectedTemplateId(parsed[0].id);
          setMessage(parsed[0].text);
          setMessagingTag(parsed[0].tag);
          setCtaLabel(parsed[0].ctaLabel ?? "");
          setCtaUrl(parsed[0].ctaUrl ?? "");
        }
      } catch (error) {
        console.warn("Failed to load templates from storage", error);
      }
    }

    const savedLogs = window.localStorage.getItem(STORAGE_KEYS.logs);
    if (savedLogs) {
      try {
        const parsedLogs: SendLog[] = JSON.parse(savedLogs);
        setLogs(parsedLogs);
      } catch (error) {
        console.warn("Failed to load logs from storage", error);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(STORAGE_KEYS.templates, JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(logs));
  }, [logs]);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId),
    [templates, selectedTemplateId]
  );

  useEffect(() => {
    if (selectedTemplate) {
      setMessage(selectedTemplate.text);
      setMessagingTag(selectedTemplate.tag);
      setCtaLabel(selectedTemplate.ctaLabel ?? "");
      setCtaUrl(selectedTemplate.ctaUrl ?? "");
    }
  }, [selectedTemplate]);

  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage(null);
    setStatusVariant(null);
    setIsSending(true);

    try {
      const payload = {
        recipientId: recipientId.trim(),
        message: message.trim(),
        messagingTag,
        ctaLabel: ctaLabel.trim() || undefined,
        ctaUrl: ctaUrl.trim() || undefined,
        accessToken: accessToken.trim() || undefined,
        businessAccountId: senderId.trim() || undefined
      };

      const response = await fetch("/api/send-dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to send DM");
      }

      const logEntry: SendLog = {
        id: crypto.randomUUID(),
        recipientId: payload.recipientId,
        message: payload.message,
        tag: payload.messagingTag,
        resultId: result.id,
        timestamp: new Date().toISOString()
      };

      setLogs((prev) => [logEntry, ...prev].slice(0, 25));
      setStatusVariant("success");
      setStatusMessage("Direct message sent successfully.");
    } catch (error) {
      console.error(error);
      setStatusVariant("error");
      setStatusMessage(
        error instanceof Error ? error.message : "Unable to send direct message."
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleTemplateCreation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newTemplate.name.trim() || !newTemplate.text.trim()) {
      return;
    }

    const created: Template = {
      id: `template-${crypto.randomUUID()}`,
      name: newTemplate.name.trim(),
      text: newTemplate.text.trim(),
      tag: newTemplate.tag,
      ctaLabel: newTemplate.ctaLabel.trim() || undefined,
      ctaUrl: newTemplate.ctaUrl.trim() || undefined
    };

    setTemplates((prev) => [created, ...prev]);
    setSelectedTemplateId(created.id);
    setNewTemplate({
      name: "",
      text: "",
      tag: "ACCOUNT_UPDATE",
      ctaLabel: "",
      ctaUrl: ""
    });
    setStatusVariant("success");
    setStatusMessage("Template saved to workspace.");
  };

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white md:text-4xl">
            Instagram Auto DM Agent
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300 md:text-base">
            Automate personalized Instagram conversations, run retention
            campaigns, and deliver sequenced DMs triggered by external workflows.
            Provide a long-lived access token and sender ID to send real messages
            through the Instagram Graph API.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="https://developers.facebook.com/docs/messenger-platform/instagram/features/automated-messaging"
            className="rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-50 transition hover:bg-slate-700"
            target="_blank"
            rel="noreferrer"
          >
            Meta API Docs
          </Link>
          <Link
            href="https://developers.facebook.com/apps"
            className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-primary hover:text-white"
            target="_blank"
            rel="noreferrer"
          >
            Manage App
          </Link>
        </div>
      </header>

      {statusMessage && statusVariant && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            statusVariant === "success"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
              : "border-rose-500/40 bg-rose-500/10 text-rose-200"
          }`}
        >
          {statusMessage}
        </div>
      )}

      <section className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <form
          className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/40 backdrop-blur"
          onSubmit={handleSend}
        >
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-white">
              Real-Time Message Composer
            </h2>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Live Execution
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-300">
            Plug this agent into your lead capture, checkout, or community
            onboarding funnels. Use merge tags like{" "}
            <code className="rounded bg-slate-800 px-1 py-0.5 text-xs font-mono text-slate-200">
              {"{{first_name}}"}
            </code>{" "}
            that your automations can replace before submitting.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="flex flex-col text-sm font-medium text-slate-200">
              Recipient IG User ID
              <input
                className="mt-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
                placeholder="e.g. 17841400000000000"
                value={recipientId}
                onChange={(event) => setRecipientId(event.target.value)}
                required
              />
            </label>
            <label className="flex flex-col text-sm font-medium text-slate-200">
              Messaging Tag
              <select
                className="mt-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
                value={messagingTag}
                onChange={(event) =>
                  setMessagingTag(event.target.value as MessagingTag)
                }
              >
                <option value="ACCOUNT_UPDATE">Account Update</option>
                <option value="CONFIRMED_EVENT_UPDATE">
                  Confirmed Event Update
                </option>
                <option value="POST_PURCHASE_UPDATE">Post Purchase Update</option>
                <option value="HUMAN_AGENT">Human Agent (24h)</option>
                <option value="CUSTOMER_FEEDBACK">Customer Feedback</option>
              </select>
            </label>
            <label className="flex flex-col text-sm font-medium text-slate-200">
              Access Token (optional)
              <input
                className="mt-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
                placeholder="Override env token"
                value={accessToken}
                onChange={(event) => setAccessToken(event.target.value)}
              />
            </label>
            <label className="flex flex-col text-sm font-medium text-slate-200">
              Sender IG Business Account ID (optional)
              <input
                className="mt-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
                placeholder="Override env sender ID"
                value={senderId}
                onChange={(event) => setSenderId(event.target.value)}
              />
            </label>
          </div>

          <div className="mt-6 grid gap-4">
            <label className="flex flex-col text-sm font-medium text-slate-200">
              Message Body
              <textarea
                className="mt-2 min-h-[140px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
                placeholder="Craft a hyper-personal DM..."
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
            </label>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="flex flex-col text-sm font-medium text-slate-200">
              Call-to-Action Label
              <input
                className="mt-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
                placeholder="Open Offer"
                value={ctaLabel}
                onChange={(event) => setCtaLabel(event.target.value)}
              />
            </label>
            <label className="flex flex-col text-sm font-medium text-slate-200">
              Call-to-Action URL
              <input
                className="mt-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
                placeholder="https://..."
                value={ctaUrl}
                onChange={(event) => setCtaUrl(event.target.value)}
              />
            </label>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <div className="text-xs text-slate-400">
              Apply templates or add merge tags before executing. Messages are
              executed instantly using the Instagram Graph API endpoint{" "}
              <code className="rounded bg-slate-800 px-1 py-0.5 font-mono text-[11px] text-slate-200">
                POST /{`{ig_business_account_id}`}/messages
              </code>
              .
            </div>
            <button
              type="submit"
              className="h-11 rounded-lg bg-primary px-6 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/50"
              disabled={isSending}
            >
              {isSending ? "Sending..." : "Send Direct Message"}
            </button>
          </div>
        </form>

        <aside className="flex h-fit flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <h3 className="text-lg font-semibold text-white">
            Template Control Center
          </h3>
          <p className="text-sm text-slate-300">
            Curate campaign flows grouped by funnel stage. Templates sync locally
            to your browser and can be remixed into multi-step automations.
          </p>

          <div className="flex flex-col gap-3">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => setSelectedTemplateId(template.id)}
                className={`rounded-xl border px-3 py-3 text-left transition ${
                  selectedTemplateId === template.id
                    ? "border-primary/70 bg-primary/10 text-white"
                    : "border-slate-800 bg-slate-950 text-slate-200 hover:border-slate-700 hover:bg-slate-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{template.name}</span>
                  <span className="rounded-lg bg-slate-800 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-200">
                    {template.tag.replaceAll("_", " ")}
                  </span>
                </div>
                <p className="mt-2 line-clamp-3 text-xs text-slate-300">
                  {template.text}
                </p>
                {template.ctaUrl && (
                  <p className="mt-2 text-[11px] text-accent">
                    CTA &gt; {template.ctaLabel ?? "Open"}
                  </p>
                )}
              </button>
            ))}
          </div>
        </aside>
      </section>

      <section className="grid gap-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <h3 className="text-lg font-semibold text-white">
            Build New Automation Template
          </h3>
          <p className="mt-1 text-sm text-slate-300">
            Capture a recurring outreach block once, then deploy it across
            triggers or sequences. Use placeholders like{" "}
            <code className="rounded bg-slate-800 px-1 py-0.5 text-[11px] font-mono text-slate-100">
              {"{{utm_source}}"}
            </code>{" "}
            to track attribution.
          </p>

          <form
            className="mt-4 grid gap-4"
            onSubmit={handleTemplateCreation}
          >
            <label className="flex flex-col text-sm font-medium text-slate-200">
              Template Name
              <input
                className="mt-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
                value={newTemplate.name}
                onChange={(event) =>
                  setNewTemplate((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Lead Magnet Follow-Up"
                required
              />
            </label>
            <label className="flex flex-col text-sm font-medium text-slate-200">
              Message Blueprint
              <textarea
                className="mt-2 min-h-[120px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
                value={newTemplate.text}
                onChange={(event) =>
                  setNewTemplate((prev) => ({ ...prev, text: event.target.value }))
                }
                placeholder="Hey {{first_name}}! Thanks for downloading our guide..."
                required
              />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col text-sm font-medium text-slate-200">
                Messaging Tag
                <select
                  className="mt-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
                  value={newTemplate.tag}
                  onChange={(event) =>
                    setNewTemplate((prev) => ({
                      ...prev,
                      tag: event.target.value as MessagingTag
                    }))
                  }
                >
                  <option value="ACCOUNT_UPDATE">Account Update</option>
                  <option value="CONFIRMED_EVENT_UPDATE">
                    Confirmed Event Update
                  </option>
                  <option value="POST_PURCHASE_UPDATE">
                    Post Purchase Update
                  </option>
                  <option value="HUMAN_AGENT">Human Agent (24h)</option>
                  <option value="CUSTOMER_FEEDBACK">Customer Feedback</option>
                </select>
              </label>
              <label className="flex flex-col text-sm font-medium text-slate-200">
                CTA Label
                <input
                  className="mt-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
                  value={newTemplate.ctaLabel}
                  onChange={(event) =>
                    setNewTemplate((prev) => ({
                      ...prev,
                      ctaLabel: event.target.value
                    }))
                  }
                  placeholder="View Offer"
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-slate-200">
                CTA URL
                <input
                  className="mt-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
                  value={newTemplate.ctaUrl}
                  onChange={(event) =>
                    setNewTemplate((prev) => ({
                      ...prev,
                      ctaUrl: event.target.value
                    }))
                  }
                  placeholder="https://..."
                />
              </label>
            </div>
            <button
              type="submit"
              className="mt-2 h-11 rounded-lg border border-primary/70 bg-primary/20 text-sm font-semibold text-primary transition hover:bg-primary/30"
            >
              Save Template
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-dashed border-slate-700 bg-slate-950/40 p-4">
          <h4 className="text-base font-semibold text-white">
            Fast Sequencing Ideas
          </h4>
          <p className="text-sm text-slate-300">
            Combine templates with external schedulers (Zapier, Make, n8n, or a
            custom webhook) to drip content. Pass the template payload to this
            agent with the right timing to maintain inbox health.
          </p>
          <ul className="space-y-3 text-sm text-slate-200">
            <li className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
              <span className="font-semibold text-primary">Day 0</span>: Welcome +
              deliver asset
            </li>
            <li className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
              <span className="font-semibold text-primary">Day 2</span>: Value
              nurture with CTA to book call
            </li>
            <li className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
              <span className="font-semibold text-primary">Day 5</span>: Social
              proof + community invite
            </li>
          </ul>
          <div className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-3 text-xs text-slate-300">
            This UI focuses on orchestration. For background jobs, deploy a
            scheduler (Supabase cron, Vercel cron, AWS EventBridge) pointing at{" "}
            <code className="rounded bg-slate-800 px-1 py-0.5 font-mono text-[11px] text-slate-200">
              POST /api/send-dm
            </code>{" "}
            with your template payload.
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h3 className="text-lg font-semibold text-white">Delivery Timeline</h3>
          <button
            type="button"
            className="text-xs font-semibold uppercase tracking-wide text-slate-400 hover:text-slate-200"
            onClick={() => setLogs([])}
          >
            Clear History
          </button>
        </div>
        <p className="text-sm text-slate-300">
          Recent DM executions tracked locally. Export logs into your CRM by
          copying payloads below.
        </p>

        <div className="mt-4 space-y-3">
          {logs.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/40 px-4 py-6 text-center text-sm text-slate-400">
              No messages sent yet. Build a template and fire your first DM.
            </div>
          )}
          {logs.map((log) => (
            <div
              key={log.id}
              className="grid gap-3 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-4 md:grid-cols-[1.2fr_1fr]"
            >
              <div>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="font-mono text-xs text-slate-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-300">
                    Sent
                  </span>
                  {log.tag && (
                    <span className="rounded-full bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-200">
                      {log.tag}
                    </span>
                  )}
                </div>
                <div className="mt-2 text-sm text-slate-100">
                  <span className="font-semibold text-slate-300">Recipient:</span>{" "}
                  {log.recipientId}
                </div>
                <p className="mt-2 whitespace-pre-wrap rounded bg-slate-900 px-3 py-2 text-sm text-slate-200">
                  {log.message}
                </p>
              </div>
              <div className="flex flex-col justify-between gap-3 text-xs text-slate-400">
                <div>
                  <span className="font-semibold text-slate-300">
                    Graph Message ID
                  </span>
                  <p className="mt-1 break-all font-mono text-[11px] text-slate-400">
                    {log.resultId ?? "n/a"}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-slate-300">
                    Delivery Payload
                  </span>
                  <pre className="mt-2 overflow-x-auto rounded bg-slate-900 px-3 py-2 text-[11px] leading-relaxed text-slate-300">
                    {JSON.stringify(
                      {
                        recipientId: log.recipientId,
                        message: log.message,
                        tag: log.tag,
                        messageId: log.resultId
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
