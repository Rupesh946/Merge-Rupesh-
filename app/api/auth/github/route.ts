import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const baseUrl = process.env.NEXTAUTH_URL || `${url.protocol}//${url.host}`;
    
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = `${baseUrl}/api/auth/github/callback`;
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=read:user user:email`;
    
    return NextResponse.redirect(githubAuthUrl);
}
