import { useEffect, useRef, useState } from 'react';
import { StreamChat, TokenOrProvider, User } from 'stream-chat';

export type UseClientOptions = {
  apiKey: string;
  user: User;
  tokenOrProvider: TokenOrProvider;
};

export const useClient = ({
  apiKey,
  user,
  tokenOrProvider,
}: UseClientOptions): StreamChat | undefined => {
  const [chatClient, setChatClient] = useState<StreamChat>();
  const tokenRef = useRef<TokenOrProvider>(tokenOrProvider);
  const userRef = useRef<User>(user);
  const effectGenerationRef = useRef(0);
  tokenRef.current = tokenOrProvider;
  userRef.current = user;

  useEffect(() => {
    const token = tokenRef.current;
    const currentUser = userRef.current;
    if (!currentUser?.id || !token || typeof token !== 'string') return;

    const generation = ++effectGenerationRef.current;
    const client = new StreamChat(apiKey);
    let disposed = false;

    const connectPromise = (async () => {
      try {
        await client.connectUser(currentUser, token);
        if (disposed || generation !== effectGenerationRef.current) {
          await client.disconnectUser();
          return;
        }
        setChatClient(client);
        if (typeof window !== 'undefined') {
          (window as unknown as { client?: StreamChat }).client = client;
        }
      } catch {
        if (!disposed) setChatClient(undefined);
      }
    })();

    return () => {
      disposed = true;
      connectPromise.then(() => client.disconnectUser()).catch(() => {});
    };
  }, [apiKey, user?.id]);

  return chatClient;
};
