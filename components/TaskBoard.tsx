'use client';

import { useEffect, useState } from 'react';
import { ArrowPathIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { Task } from '@/lib/types';

const statusLabels: Record<Task['status'], string> = {
  backlog: 'Backlog',
  in_progress: 'In Progress',
  done: 'Done'
};

const statusOptions: Task['status'][] = ['backlog', 'in_progress', 'done'];
const priorityOptions: Task['priority'][] = ['low', 'medium', 'high'];

type Props = {
  tasks: Task[];
  creating: boolean;
  onCreate: (input: { title: string; priority: Task['priority']; page_url?: string }) => Promise<void>;
  onPersist: (task: Task) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  contextUrl?: string;
};

type DraftMap = Record<string, Task>;

export function TaskBoard({ tasks, creating, onCreate, onPersist, onDelete, contextUrl }: Props) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<DraftMap>({});

  useEffect(() => {
    setDrafts((current) => {
      const next: DraftMap = {};
      tasks.forEach((task) => {
        next[task.id] = current[task.id] ?? task;
      });
      return next;
    });
  }, [tasks]);

  const upsertDraft = (taskId: string, updates: Partial<Task>) => {
    setDrafts((current) => ({
      ...current,
      [taskId]: { ...current[taskId], ...updates }
    }));
  };

  const persistDraft = async (taskId: string) => {
    const draft = drafts[taskId];
    if (draft) {
      await onPersist(draft);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) {
      setError('Add a task title first.');
      return;
    }

    setError(null);
    await onCreate({ title, priority, page_url: contextUrl });
    setTitle('');
    setPriority('medium');
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Execution Tasks</h2>
          <p className="mt-1 text-sm text-slate-400">
            Track decisions and follow-ups extracted from the page. Update status as you close the loop.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4 md:grid-cols-[1fr_auto_auto]">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Define the outcome you need to achieve…"
          className="rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
        />
        <select
          value={priority}
          onChange={(event) => setPriority(event.target.value as Task['priority'])}
          className="rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
        >
          {priorityOptions.map((option) => (
            <option value={option} key={option} className="text-slate-900">
              {option.charAt(0).toUpperCase() + option.slice(1)} priority
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={creating}
          className="inline-flex items-center justify-center rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/60 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {creating && <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />}Add task
        </button>
        {error && <p className="text-xs text-rose-300 md:col-span-3">{error}</p>}
      </form>

      <div className="mt-6 space-y-3">
        {tasks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-700 bg-slate-950/40 p-6 text-sm text-slate-400">
            No tracked tasks yet. Promote actions from the insight panel or capture tasks manually.
          </p>
        ) : (
          tasks.map((task) => {
            const draft = drafts[task.id] ?? task;
            return (
              <article
                key={task.id}
                className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-4 transition hover:border-sky-500/40 hover:bg-slate-950"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <input
                    className="w-full flex-1 rounded-lg border border-transparent bg-transparent text-lg font-semibold text-slate-100 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                    value={draft.title}
                    onChange={(event) => upsertDraft(task.id, { title: event.target.value })}
                    onBlur={() => {
                      void persistDraft(task.id);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => onDelete(task.id)}
                    className="rounded-md border border-transparent p-2 text-slate-500 transition hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid gap-3 text-sm text-slate-300 md:grid-cols-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs uppercase tracking-wide text-slate-500">Status</span>
                    <select
                      value={draft.status}
                      onChange={(event) => {
                        const nextStatus = event.target.value as Task['status'];
                        upsertDraft(task.id, { status: nextStatus });
                        void persistDraft(task.id);
                      }}
                      className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                    >
                      {statusOptions.map((option) => (
                        <option key={option} value={option} className="text-slate-900">
                          {statusLabels[option]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs uppercase tracking-wide text-slate-500">Priority</span>
                    <select
                      value={draft.priority}
                      onChange={(event) => {
                        const nextPriority = event.target.value as Task['priority'];
                        upsertDraft(task.id, { priority: nextPriority });
                        void persistDraft(task.id);
                      }}
                      className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                    >
                      {priorityOptions.map((option) => (
                        <option key={option} value={option} className="text-slate-900">
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 md:col-span-1">
                    <span className="text-xs uppercase tracking-wide text-slate-500">Notes</span>
                    <textarea
                      value={draft.notes ?? ''}
                      onChange={(event) => upsertDraft(task.id, { notes: event.target.value })}
                      onBlur={() => {
                        void persistDraft(task.id);
                      }}
                      rows={2}
                      placeholder="Add context, blockers, or links"
                      className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                    />
                  </label>
                </div>

                {draft.page_url && (
                  <a
                    href={draft.page_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-xs text-sky-400"
                  >
                    Linked source
                  </a>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
