import { UserObject } from '@/model/UserObject';
import { StreamChat } from 'stream-chat';

export async function GET() {
  console.log('[/api/users] GET called');
  try {
    const apiKey = process.env.NEXT_PUBLIC_STREAM_CHAT_API_KEY ?? '';
    const secret = process.env.STREAM_CHAT_SECRET ?? '';
    if (!apiKey || !secret) {
      console.error('[/api/users] Missing Stream env keys');
      return Response.json(
        { error: 'Server misconfiguration: Stream keys not set' },
        { status: 500 }
      );
    }
    const serverClient = StreamChat.getInstance(apiKey, secret);
    console.log('[/api/users] Querying users');
    const response = await serverClient.queryUsers({});
    const data: UserObject[] = response.users
      .filter((user) => user.role !== 'admin')
      .map((user) => {
        return {
          id: user.id,
          name: user.name ?? user.id,
          image: user.image as string,
          online: user.online,
          lastOnline: user.last_active,
        };
      });
    console.log('[/api/users] Returning', data.length, 'users');
    return Response.json({ data });
  } catch (err) {
    console.error('[/api/users] Error:', err);
    return Response.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
