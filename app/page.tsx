'use client';

import { User } from 'stream-chat';
import { LoadingIndicator } from 'stream-chat-react';
import { useClerk } from '@clerk/nextjs';
import { useCallback, useEffect, useRef, useState } from 'react';
import MyChat from '@/components/MyChat';

const apiKey = process.env.NEXT_PUBLIC_STREAM_CHAT_API_KEY ?? '';

export type DiscordServer = {
  id?: string;
  name: string;
  image: string | undefined;
};

export type Homestate = {
  apiKey: string;
  user: User;
  token: string;
};

export default function Home() {
  const [myState, setMyState] = useState<Homestate | undefined>(undefined);
  const { user: myUser } = useClerk();
  const fetchedForUserIdRef = useRef<string | null>(null);

  const registerUser = useCallback(async () => {
    const userId = myUser?.id;
    const mail = myUser?.primaryEmailAddress?.emailAddress;
    if (!userId || !mail) return;
    const streamResponse = await fetch('/api/register-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, email: mail }),
    });
    if (!streamResponse.ok) {
      const err = await streamResponse.json().catch(() => ({}));
      throw new Error(err?.error ?? 'Failed to register with chat');
    }
    await streamResponse.json();
  }, [myUser]);

  useEffect(() => {
    if (!myUser?.id || !myUser?.primaryEmailAddress?.emailAddress) return;
    if (fetchedForUserIdRef.current === myUser.id) return;
    fetchedForUserIdRef.current = myUser.id;
    const userId = myUser.id;
    const userName = myUser.primaryEmailAddress.emailAddress;
    let cancelled = false;
    (async () => {
      try {
        await registerUser();
      } catch {
        // Continue to get token even if upsert fails (user may already exist on Stream)
      }
      if (cancelled) return;
      const response = await fetch('/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const responseBody = await response.json();
      const token = responseBody.token;
      if (cancelled || !token) return;
      const user: User = {
        id: userId,
        name: userName,
        image: `https://getstream.io/random_png/?id=${userId}&name=${encodeURIComponent(userName)}`,
      };
      setMyState({ apiKey, user, token });
    })();
    return () => {
      cancelled = true;
    };
  }, [myUser?.id, myUser?.primaryEmailAddress?.emailAddress, registerUser]);

  if (!myState) {
    return <LoadingIndicator />;
  }

  return <MyChat {...myState} />;
}
