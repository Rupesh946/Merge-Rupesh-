import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { jwtVerify } from 'jose';

/**
 * GET /api/github/repos
 * Returns the authenticated user's GitHub repositories,
 * proxied through the backend using their stored githubAccessToken.
 */
export async function GET(req: Request) {
  try {
    // 1. Verify app JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default_secret');
    const { payload } = await jwtVerify(token, secret);

    if (!payload.id) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // 2. Get user's GitHub access token from DB
    const user = await prisma.user.findUnique({
      where: { id: payload.id as string },
      select: { githubAccessToken: true, githubUsername: true },
    });

    if (!user?.githubAccessToken) {
      return NextResponse.json(
        { message: 'GitHub account not connected. Please sign in with GitHub.' },
        { status: 403 }
      );
    }

    // 3. Proxy to GitHub API
    const { searchParams } = new URL(req.url);
    const perPage = searchParams.get('per_page') || '50';
    const sort = searchParams.get('sort') || 'updated';

    const githubRes = await fetch(
      `https://api.github.com/user/repos?sort=${sort}&per_page=${perPage}&visibility=all`,
      {
        headers: {
          Authorization: `Bearer ${user.githubAccessToken}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Merge-App',
        },
      }
    );

    if (!githubRes.ok) {
      const errorText = await githubRes.text();
      console.error('GitHub API error:', githubRes.status, errorText);
      if (githubRes.status === 401) {
        // Token expired or revoked
        return NextResponse.json(
          { message: 'GitHub token expired. Please sign in with GitHub again.' },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { message: 'Failed to fetch GitHub repositories' },
        { status: githubRes.status }
      );
    }

    const repos = await githubRes.json();
    return NextResponse.json({ repos });
  } catch (err) {
    console.error('GitHub repos proxy error:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
