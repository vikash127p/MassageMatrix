import { StreamVideoClient } from '@stream-io/video-client';
import { useEffect, useRef, useState } from 'react';
import { UseClientOptions } from './useClient';

export const useVideoClient = ({
  apiKey,
  user,
  tokenOrProvider,
}: UseClientOptions): StreamVideoClient | undefined => {
  const [videoClient, setVideoClient] = useState<StreamVideoClient>();
  const tokenRef = useRef(tokenOrProvider);
  const userRef = useRef(user);
  const effectGenerationRef = useRef(0);
  tokenRef.current = tokenOrProvider;
  userRef.current = user;

  useEffect(() => {
    const token = tokenRef.current;
    const currentUser = userRef.current;
    if (!token || typeof token !== 'string') return;

    const generation = ++effectGenerationRef.current;
    const streamVideoClient = new StreamVideoClient({ apiKey });
    let disposed = false;

    const connectPromise = (async () => {
      try {
        await streamVideoClient.connectUser(currentUser, token);
        if (disposed || generation !== effectGenerationRef.current) {
          await streamVideoClient.disconnectUser();
          return;
        }
        setVideoClient(streamVideoClient);
      } catch {
        if (!disposed) setVideoClient(undefined);
      }
    })();

    return () => {
      disposed = true;
      setVideoClient(undefined);
      connectPromise.then(() => streamVideoClient.disconnectUser()).catch(() => {});
    };
  }, [apiKey, user.id]);

  return videoClient;
};
