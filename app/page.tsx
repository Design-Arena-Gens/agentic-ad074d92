'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PageIngestor } from '@/components/PageIngestor';
import { InsightsPanel } from '@/components/InsightsPanel';
import { TaskBoard } from '@/components/TaskBoard';
import type { AgentInsight, Task } from '@/lib/types';

const toastsLimit = 4;

type Toast = {
  id: number;
  message: string;
  tone: 'success' | 'error';
};

export default function HomePage() {
  const [insight, setInsight] = useState<AgentInsight | undefined>();
  const [sourceUrl, setSourceUrl] = useState<string | undefined>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [creatingTask, setCreatingTask] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastCounter = useRef(0);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    toastCounter.current += 1;
    const id = toastCounter.current;
    setToasts((previous) => {
      const next = [...previous, { ...toast, id }];
      return next.slice(next.length - toastsLimit);
    });
    setTimeout(() => {
      setToasts((previous) => previous.filter((item) => item.id !== id));
    }, 4000);
  }, []);

  const loadTasks = useCallback(async () => {
    setLoadingTasks(true);
    try {
      const response = await fetch('/api/tasks');
      if (!response.ok) {
        throw new Error('Server is not configured for Supabase task storage.');
      }

      const data = await response.json();
      setTasks(data.tasks ?? []);
    } catch (error) {
      console.error(error);
      addToast({ tone: 'error', message: error instanceof Error ? error.message : 'Cannot load tasks.' });
    } finally {
      setLoadingTasks(false);
    }
  }, [addToast]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const handleInsight = ({ insight: nextInsight, url }: { insight: AgentInsight; url?: string }) => {
    setInsight(nextInsight);
    setSourceUrl(url);
    addToast({ tone: 'success', message: 'Page analyzed successfully.' });
  };

  const handleCreateTask = async ({
    title,
    priority,
    page_url
  }: {
    title: string;
    priority: Task['priority'];
    page_url?: string;
  }) => {
    setCreatingTask(true);
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, priority, page_url, status: 'backlog' })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to create task.');
      }

      setTasks((previous) => [data.task, ...previous]);
      addToast({ tone: 'success', message: 'Task created.' });
    } catch (error) {
      addToast({ tone: 'error', message: error instanceof Error ? error.message : 'Create failed.' });
    } finally {
      setCreatingTask(false);
    }
  };

  const persistTask = async (task: Task) => {
    setTasks((previous) => previous.map((existing) => (existing.id === task.id ? task : existing)));
    try {
      const response = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to update task.');
      }

      setTasks((previous) =>
        previous.map((existing) => (existing.id === task.id ? { ...existing, ...data.task } : existing))
      );
      addToast({ tone: 'success', message: 'Task updated.' });
    } catch (error) {
      addToast({ tone: 'error', message: error instanceof Error ? error.message : 'Update failed.' });
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const response = await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });
      if (!response.ok && response.status !== 204) {
        const data = await response.json();
        throw new Error(data.error || 'Unable to delete task.');
      }

      setTasks((previous) => previous.filter((task) => task.id !== id));
      addToast({ tone: 'success', message: 'Task deleted.' });
    } catch (error) {
      addToast({ tone: 'error', message: error instanceof Error ? error.message : 'Delete failed.' });
    }
  };

  const taskCountSummary = useMemo(() => {
    const counts = tasks.reduce(
      (acc, task) => {
        acc[task.status] += 1;
        return acc;
      },
      { backlog: 0, in_progress: 0, done: 0 }
    );
    return counts;
  }, [tasks]);

  return (
    <main className="space-y-10">
      <header className="space-y-3">
        <span className="inline-flex items-center rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-300">
          Agentic browser copilot
        </span>
        <h1 className="text-3xl font-semibold text-white md:text-4xl">
          Read Chrome pages, reason through context, and orchestrate execution.
        </h1>
        <p className="max-w-3xl text-slate-400">
          Capture any web page you&apos;re exploring, get distilled intelligence, and turn insights into
          a sequenced plan. Powered by Supabase for persistence and Tailwind CSS for rapid iteration.
        </p>

        <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-400">
          <span className="rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2">
            Backlog: {taskCountSummary.backlog}
          </span>
          <span className="rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2">
            In progress: {taskCountSummary.in_progress}
          </span>
          <span className="rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2">
            Done: {taskCountSummary.done}
          </span>
          {loadingTasks && <span>Loading tasks…</span>}
        </div>
      </header>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <PageIngestor onInsight={handleInsight} />
          <TaskBoard
            tasks={tasks}
            creating={creatingTask}
            onCreate={handleCreateTask}
            onPersist={persistTask}
            onDelete={deleteTask}
            contextUrl={sourceUrl}
          />
        </div>
        <InsightsPanel
          insight={insight}
          sourceUrl={sourceUrl}
          onPromoteAction={(action) => {
            void handleCreateTask({ title: action, priority: 'medium', page_url: sourceUrl });
          }}
        />
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
        <h2 className="text-lg font-semibold text-slate-200">Supabase setup</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-4">
          <li>
            Create a `tasks` table with columns: `id uuid primary key default gen_random_uuid()`,
            `title text`, `status text`, `priority text`, `page_url text`, `notes text`,
            `created_at timestamptz default now()`.
          </li>
          <li>
            Create a `page_captures` table with columns: `id uuid primary key`, `url text`, `html text`,
            `insight jsonb`, `created_at timestamptz default now()`.
          </li>
          <li>
            Add Row Level Security policies that permit service role access for inserts/updates.
          </li>
          <li>
            Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
            `SUPABASE_SERVICE_ROLE_KEY` environment variables.
          </li>
        </ol>
      </section>

      {toasts.length > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`pointer-events-auto rounded-full border px-4 py-2 text-sm shadow-lg backdrop-blur ${
                toast.tone === 'success'
                  ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-200'
                  : 'border-rose-500/40 bg-rose-500/20 text-rose-200'
              }`}
            >
              {toast.message}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
