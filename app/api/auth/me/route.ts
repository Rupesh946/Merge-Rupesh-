import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { jwtVerify } from 'jose';

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get('authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const token = authHeader.split(' ')[1];
        
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default_secret');
        const { payload } = await jwtVerify(token, secret);

        if (!payload || !payload.id) {
             return NextResponse.json(
                { message: 'Invalid token' },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.id as string }
        });

        if (!user) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json({
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Auth check error:', error);
        return NextResponse.json(
            { message: 'Internal server error or invalid token' },
            { status: 401 }
        );
    }
}
