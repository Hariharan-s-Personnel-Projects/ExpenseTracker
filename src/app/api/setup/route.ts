import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Missing Supabase credentials in .env.local' }, { status: 500 })
  }

  // 1. Test basic connection
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    })
    
    if (!res.ok) {
      return NextResponse.json({ 
        error: 'Supabase connection failed',
        status: res.status,
        statusText: res.statusText,
        hint: 'Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
      }, { status: 500 })
    }
  } catch (e: any) {
    return NextResponse.json({ 
      error: 'Cannot reach Supabase',
      details: e.message 
    }, { status: 500 })
  }

  // 2. Try to query the users table
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/users?select=id&limit=1`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    })

    if (res.status === 404 || res.status === 406) {
      return NextResponse.json({
        connection: '✅ Supabase credentials are valid',
        tables: '❌ "users" table does NOT exist',
        action: 'You must run the supabase_schema.sql in your Supabase Dashboard → SQL Editor. Steps: 1) Open https://supabase.com/dashboard 2) Go to your project 3) Click "SQL Editor" in the left sidebar 4) Paste the contents of supabase_schema.sql 5) Click "Run"'
      })
    }

    if (res.ok) {
      return NextResponse.json({
        connection: '✅ Supabase credentials are valid',
        tables: '✅ "users" table exists',
        status: 'Everything looks good! You can sign up now.'
      })
    }

    const body = await res.text()
    return NextResponse.json({
      connection: '✅ Supabase credentials are valid',
      tables: `⚠️ Unexpected response checking "users" table (status ${res.status})`,
      body
    })
  } catch (e: any) {
    return NextResponse.json({ 
      error: 'Error checking tables',
      details: e.message 
    }, { status: 500 })
  }
}
