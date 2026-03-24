import { jwtVerify } from 'jose';
import prisma from './prisma';

const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET || 'default_secret');

export function getTokenFromRequest(req: Request): string | null {
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }
    return null;
}

export async function verifyToken(token: string) {
    const { payload } = await jwtVerify(token, getSecret());
    return payload;
}

export async function getUserFromRequest(req: Request) {
    const token = getTokenFromRequest(req);
    if (!token) throw new Error('No token provided');

    const payload = await verifyToken(token);
    if (!payload.id) throw new Error('Invalid token');

    const user = await prisma.user.findUnique({
        where: { id: payload.id as string },
    });

    if (!user) throw new Error('User not found');
    return user;
}
