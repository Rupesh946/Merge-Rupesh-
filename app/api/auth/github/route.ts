import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.GITHUB_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json({ message: 'GitHub OAuth not configured' }, { status: 500 });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    scope: 'read:user user:email repo',
    redirect_uri: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/github/callback`,
  });

  return NextResponse.redirect(`https://github.com/login/oauth/authorize?${params}`);
}
