import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { SignJWT } from 'jose';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  if (error || !code) {
    return NextResponse.redirect(`${baseUrl}/auth/signin?error=github_denied`);
  }

  try {
    // 1. Exchange code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${baseUrl}/api/auth/github/callback`,
      }),
      cache: 'no-store',
    });

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      console.error('GitHub token exchange failed:', tokenData);
      return NextResponse.redirect(`${baseUrl}/auth/signin?error=github_token_failed`);
    }

    // 2. Fetch GitHub user profile
    const githubUserRes = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Merge-App',
      },
    });

    const githubUser = await githubUserRes.json();

    // 3. Fetch user's primary email if not public
    let email = githubUser.email;
    if (!email) {
      const emailsRes = await fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Merge-App',
        },
      });
      const emails: Array<{ email: string; primary: boolean; verified: boolean }> = await emailsRes.json();
      const primary = emails.find((e) => e.primary && e.verified);
      email = primary?.email || emails[0]?.email;
    }

    if (!email) {
      return NextResponse.redirect(`${baseUrl}/auth/signin?error=no_email`);
    }

    // 4. Upsert user in DB
    const username = githubUser.login;
    const name = githubUser.name || githubUser.login;
    const image = githubUser.avatar_url;

    // Check if user exists by email or githubUsername
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { githubUsername: username },
        ],
      },
    });

    if (user) {
      // Update existing user with latest GitHub info and store access token
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          githubUsername: username,
          githubAccessToken: accessToken,
          image: image || user.image,
          name: user.name || name,
        },
      });
    } else {
      // Create new user from GitHub
      // Generate a unique username if githubUsername is taken
      let finalUsername = username;
      const existing = await prisma.user.findUnique({ where: { username } });
      if (existing) {
        finalUsername = `${username}_${Date.now()}`;
      }

      user = await prisma.user.create({
        data: {
          email,
          username: finalUsername,
          name,
          image,
          githubUsername: username,
          githubAccessToken: accessToken,
          // password is null for OAuth-only users
        },
      });
    }

    // 5. Issue app JWT
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default_secret');
    const token = await new SignJWT({ id: user.id, email: user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(secret);

    // 6. Remove sensitive fields
    const { password: _pw, githubAccessToken: _gh, ...safeUser } = user;

    // 7. Redirect to callback page with token
    const userEncoded = encodeURIComponent(JSON.stringify(safeUser));
    return NextResponse.redirect(
      `${baseUrl}/auth/callback?token=${token}&user=${userEncoded}`
    );
  } catch (err) {
    console.error('=== GitHub OAuth callback error ===');
    console.error('Error type:', typeof err);
    if (err instanceof Error) {
      console.error('Message:', err.message);
      console.error('Stack:', err.stack);
    } else {
      console.error('Raw error:', JSON.stringify(err, null, 2));
    }
    console.error('=== End GitHub OAuth error ===');
    return NextResponse.redirect(`${baseUrl}/auth/signin?error=server_error`);
  }
}
