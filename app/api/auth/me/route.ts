import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { jwtVerify } from 'jose';

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const token = authHeader.split(' ')[1];
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default_secret');

        const { payload } = await jwtVerify(token, secret);

        if (!payload.email) {
            return NextResponse.json(
                { message: 'Invalid token' },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email: payload.email as string }
        });

        if (!user) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        const { password: _, githubAccessToken: _gh, ...userWithoutPassword } = user;

        return NextResponse.json({
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Session verify error:', error);
        return NextResponse.json(
            { message: 'Invalid or expired token' },
            { status: 401 }
        );
    }
}
