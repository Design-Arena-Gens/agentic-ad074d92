import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const createServiceClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

const ensureClient = () => {
  const client = createServiceClient();
  if (!client) {
    throw new Error('Supabase service credentials are missing on the server.');
  }

  return client;
};

export async function GET() {
  try {
    const supabase = ensureClient();
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ tasks: data });
  } catch (error) {
    console.error('[tasks#get]', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unable to load tasks.'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const supabase = ensureClient();

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: payload.title,
        status: payload.status ?? 'backlog',
        priority: payload.priority ?? 'medium',
        page_url: payload.page_url ?? null,
        notes: payload.notes ?? null
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ task: data }, { status: 201 });
  } catch (error) {
    console.error('[tasks#post]', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unable to create task.'
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const payload = await request.json();
    const supabase = ensureClient();

    const { data, error } = await supabase
      .from('tasks')
      .update({
        title: payload.title,
        status: payload.status,
        priority: payload.priority,
        notes: payload.notes
      })
      .eq('id', payload.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ task: data });
  } catch (error) {
    console.error('[tasks#patch]', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unable to update task.'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Task id is required.' }, { status: 400 });
    }

    const supabase = ensureClient();
    const { error } = await supabase.from('tasks').delete().eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true }, { status: 204 });
  } catch (error) {
    console.error('[tasks#delete]', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unable to delete task.'
      },
      { status: 500 }
    );
  }
}
