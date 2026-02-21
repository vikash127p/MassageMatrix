import { auth, clerkClient } from '@clerk/nextjs/server';
import { StreamChat } from 'stream-chat';

export async function POST(request: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const apiKey = process.env.NEXT_PUBLIC_STREAM_CHAT_API_KEY ?? '';
    const secret = process.env.STREAM_CHAT_SECRET ?? '';
    if (!apiKey || !secret) {
      return Response.json(
        { error: 'Server misconfiguration: Stream keys not set' },
        { status: 500 }
      );
    }
    const body = await request.json().catch(() => ({}));
    const mail = body?.email as string | undefined;
    const userId = clerkUserId;
    const displayName = (mail?.trim() || userId) as string;

    const serverClient = StreamChat.getInstance(apiKey, secret);
    await serverClient.upsertUser({
      id: userId,
      role: 'user',
      name: displayName,
      imageUrl: `https://getstream.io/random_png/?id=${userId}&name=${encodeURIComponent(displayName)}`,
    });
    await clerkClient.users.updateUser(userId, {
      publicMetadata: { streamRegistered: true },
    });
    return Response.json({ userId, userName: displayName });
  } catch (err) {
    console.error('[/api/register-user] Error:', err);
    return Response.json(
      { error: err instanceof Error ? err.message : 'Registration failed' },
      { status: 500 }
    );
  }
}
