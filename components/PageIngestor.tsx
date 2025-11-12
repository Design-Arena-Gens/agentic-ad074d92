'use client';

import { useState } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import type { AgentInsight } from '@/lib/types';

type Props = {
  onInsight: (payload: { insight: AgentInsight; url?: string }) => void;
};

type FormState = {
  url: string;
  html: string;
};

export function PageIngestor({ onInsight }: Props) {
  const [form, setForm] = useState<FormState>({ url: '', html: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: form.url || undefined,
          html: form.html || undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to analyze page');
      }

      onInsight({ insight: data.insight, url: form.url || undefined });
    } catch (ingestError) {
      setError(ingestError instanceof Error ? ingestError.message : 'Failed to analyze page');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl shadow-slate-950/50">
      <h2 className="text-xl font-semibold text-slate-100">Ingest a page</h2>
      <p className="mt-2 text-sm text-slate-400">
        Paste a live URL or raw HTML from Chrome&apos;s developer tools. The agent will extract the
        core content, identify calls-to-action, and suggest next steps.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="url" className="text-sm font-medium text-slate-300">
            URL
          </label>
          <input
            id="url"
            name="url"
            value={form.url}
            onChange={handleChange}
            placeholder="https://example.com/article"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-slate-100 shadow-inner shadow-slate-950/40 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
          />
        </div>

        <div>
          <label htmlFor="html" className="text-sm font-medium text-slate-300">
            Raw HTML (optional)
          </label>
          <textarea
            id="html"
            name="html"
            value={form.html}
            onChange={handleChange}
            rows={6}
            placeholder="Paste the page HTML source…"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 shadow-inner shadow-slate-950/40 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            className={clsx(
              'inline-flex items-center justify-center rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/60 disabled:cursor-not-allowed disabled:opacity-60',
              isSubmitting && 'animate-pulse'
            )}
            disabled={isSubmitting}
          >
            {isSubmitting && <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />}Analyze
          </button>

          <p className="text-xs text-slate-500">Only one of URL or HTML is required.</p>
        </div>

        {error && (
          <p className="rounded-md border border-rose-600/40 bg-rose-950/50 px-3 py-2 text-xs text-rose-200">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
