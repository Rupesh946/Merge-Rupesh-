import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { SignJWT } from 'jose';

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const code = url.searchParams.get('code');
        const baseUrl = process.env.NEXTAUTH_URL || `${url.protocol}//${url.host}`;

        if (!code) {
            return NextResponse.redirect(new URL('/auth/callback?error=github_denied', baseUrl));
        }

        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code,
            }),
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            console.error('GitHub Token Error:', tokenData.error, tokenData.error_description);
            return NextResponse.redirect(new URL('/auth/callback?error=github_token_failed', baseUrl));
        }

        const accessToken = tokenData.access_token;

        const userResponse = await fetch('https://api.github.com/user', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        const githubUser = await userResponse.json();

        const emailResponse = await fetch('https://api.github.com/user/emails', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        const emails = await emailResponse.json();
        const primaryEmail = emails?.find((e: any) => e.primary)?.email || emails?.[0]?.email;

        if (!primaryEmail) {
            return NextResponse.redirect(new URL('/auth/callback?error=no_email', baseUrl));
        }

        let user = await prisma.user.findUnique({
            where: { email: primaryEmail }
        });

        if (!user) {
            let username = githubUser.login;
            const existingUsername = await prisma.user.findUnique({
                where: { username }
            });

            if (existingUsername) {
                username = `${username}${Math.floor(Math.random() * 10000)}`;
            }

            user = await prisma.user.create({
                data: {
                    name: githubUser.name || githubUser.login,
                    username: username,
                    email: primaryEmail,
                    password: '', 
                    image: githubUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
                    githubUsername: githubUser.login,
                }
            });
        } else if (!user.githubUsername) {
             user = await prisma.user.update({
                where: { id: user.id },
                data: { githubUsername: githubUser.login }
             });
        }

        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default_secret');
        const token = await new SignJWT({ id: user.id, email: user.email })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('7d')
            .sign(secret);

        return NextResponse.redirect(new URL(`/auth/callback?token=${token}`, baseUrl));

    } catch (error) {
        console.error('GitHub Callback Error:', error);
        const url = new URL(request.url);
        const baseUrl = process.env.NEXTAUTH_URL || `${url.protocol}//${url.host}`;
        return NextResponse.redirect(new URL('/auth/callback?error=server_error', baseUrl));
    }
}
