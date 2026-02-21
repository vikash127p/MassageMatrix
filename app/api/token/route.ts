import { auth } from '@clerk/nextjs/server';
import { StreamChat } from 'stream-chat';

export async function POST() {
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
    const serverClient = StreamChat.getInstance(apiKey, secret);
    const token = serverClient.createToken(clerkUserId);
    return Response.json({ userId: clerkUserId, token });
  } catch (err) {
    console.error('[/api/token] Error:', err);
    return Response.json(
      { error: err instanceof Error ? err.message : 'Failed to create token' },
      { status: 500 }
    );
  }
}
