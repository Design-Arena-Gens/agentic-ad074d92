import { NextResponse } from 'next/server';
import { analyzePage } from '@/lib/page-agent';
import { createClient } from '@supabase/supabase-js';

type RequestPayload = {
  url?: string;
  html?: string;
};

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

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as RequestPayload;

    if (!payload.url && !payload.html) {
      return NextResponse.json({ error: 'Provide a url or page html to analyze.' }, { status: 400 });
    }

    let html = payload.html ?? '';

    if (!html) {
      const response = await fetch(payload.url!, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
        }
      });

      if (!response.ok) {
        return NextResponse.json(
          { error: `Unable to fetch url. Received status ${response.status}` },
          { status: 422 }
        );
      }

      html = await response.text();
    }

    const insight = analyzePage(html, payload.url);

    const serviceClient = createServiceClient();
    if (serviceClient) {
      await serviceClient.from('page_captures').insert({
        url: payload.url,
        html,
        insight
      });
    }

    return NextResponse.json({
      insight,
      meta: {
        htmlLength: html.length,
        stored: Boolean(serviceClient)
      }
    });
  } catch (error) {
    console.error('[ingest]', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unexpected error during page ingestion.'
      },
      { status: 500 }
    );
  }
}
