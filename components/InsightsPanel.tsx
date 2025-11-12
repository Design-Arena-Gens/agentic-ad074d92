'use client';

import { ClipboardDocumentListIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import type { AgentInsight } from '@/lib/types';

const InfoRow = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div className="flex items-center gap-2 text-sm text-slate-400">
    <span className="text-xs uppercase tracking-wide text-slate-500">{label}</span>
    <span className="truncate text-slate-200">{value ?? '—'}</span>
  </div>
);

type Props = {
  insight?: AgentInsight;
  sourceUrl?: string;
  onPromoteAction: (action: string) => void;
};

export function InsightsPanel({ insight, sourceUrl, onPromoteAction }: Props) {
  if (!insight) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="flex items-center gap-2 text-slate-400">
          <GlobeAltIcon className="h-5 w-5" />
          <p className="text-sm">Ingest a page to unlock insights, calls-to-action, and task suggestions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-100">Agent Insights</h2>
        <p className="mt-1 text-sm text-slate-400">
          The agent distills the page content, identifies key decisions, and surfaces actionable next
          steps you can promote into tracked tasks.
        </p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex-1 space-y-1">
            <InfoRow label="Title" value={insight.metadata.title} />
            <InfoRow label="Author" value={insight.metadata.byline} />
          </div>
          <div className="space-y-1 text-right">
            <InfoRow label="Characters" value={insight.metadata.length} />
            <InfoRow label="Domain" value={sourceUrl ? new URL(sourceUrl).hostname : insight.metadata.domain} />
          </div>
        </div>
        {sourceUrl && (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-2 text-xs text-sky-400"
          >
            <GlobeAltIcon className="h-4 w-4" />
            Open original page
          </a>
        )}
      </div>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Summary</h3>
        <p className="mt-2 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-200">
          {insight.summary}
        </p>
      </section>

      {insight.keyPoints.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Key points</h3>
          <ul className="mt-3 space-y-2">
            {insight.keyPoints.map((point) => (
              <li key={point} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-sm">
                {point}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Suggested Actions</h3>
          <span className="text-xs text-slate-500">Promote anything important into a tracked task.</span>
        </div>
        {insight.actionItems.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">No explicit calls-to-action detected.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {insight.actionItems.map((action) => (
              <li
                key={action}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-sm"
              >
                <span className="pr-4 text-slate-200">{action}</span>
                <button
                  type="button"
                  onClick={() => onPromoteAction(action)}
                  className="inline-flex items-center gap-1 rounded-md bg-sky-500/90 px-3 py-1 text-xs font-semibold text-white transition hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
                >
                  <ClipboardDocumentListIcon className="h-4 w-4" />
                  Track task
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {insight.metadata.headings.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Page outline</h3>
          <ol className="mt-3 space-y-1 text-sm text-slate-400">
            {insight.metadata.headings.map((heading, index) => (
              <li key={`${heading}-${index}`} className="truncate rounded-md border border-slate-800/50 bg-slate-950/30 px-3 py-2">
                {heading}
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
