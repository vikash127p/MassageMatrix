'use client';

import { DiscordServer } from '@/app/page';
import { Call, MemberRequest, StreamVideoClient } from '@stream-io/video-client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Channel, StreamChat } from 'stream-chat';
import { DefaultStreamChatGenerics } from 'stream-chat-react';
import { v4 as uuid } from 'uuid';

type DiscordState = {
  server?: DiscordServer;
  servers: DiscordServer[];
  setServers: React.Dispatch<React.SetStateAction<DiscordServer[]>>;
  createChannelModalOpen: boolean;
  setCreateChannelModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  callId: string | undefined;
  activeCall: Call | undefined;
  setActiveCall: (call: Call | undefined) => void;
  lastActiveChannel: Channel<DefaultStreamChatGenerics> | undefined;
  setLastActiveChannel: (channel: Channel<DefaultStreamChatGenerics> | undefined) => void;
  channelsByCategories: Map<string, Array<Channel<DefaultStreamChatGenerics>>>;
  changeServer: (server: DiscordServer | undefined, client: StreamChat) => void;
  createServer: (name: string, imageUrl?: string) => Promise<DiscordServer>;
  createChannel: (
    client: StreamChat,
    name: string,
    category: string
  ) => Promise<void>;
  createCall: (
    client: StreamVideoClient,
    server: DiscordServer,
    channelName: string,
    userIds: string[]
  ) => Promise<void>;
  inviteUsersToServer: (
    client: StreamChat,
    serverName: string,
    userIds: string[]
  ) => Promise<void>;
  setCall: (callId: string | undefined) => void;
};

const initialValue: DiscordState = {
  server: undefined,
  servers: [],
  setServers: () => {},
  createChannelModalOpen: false,
  setCreateChannelModalOpen: () => {},
  callId: undefined,
  activeCall: undefined,
  setActiveCall: () => {},
  lastActiveChannel: undefined,
  setLastActiveChannel: () => {},
  channelsByCategories: new Map(),
  changeServer: () => {},
  createServer: async () => ({ name: '', image: '' }),
  createChannel: () => {},
  createCall: async () => {},
  inviteUsersToServer: async () => {},
  setCall: () => {},
};

const DiscordContext = createContext<DiscordState>(initialValue);

export const DiscordContextProvider: any = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [servers, setServers] = useState<DiscordServer[]>([]);
  console.log('SERVERS STATE:', servers);
  const [createChannelModalOpen, setCreateChannelModalOpen] = useState(false);
  const [activeCall, setActiveCall] = useState<Call | undefined>(undefined);
  const [lastActiveChannel, setLastActiveChannel] = useState<
    Channel<DefaultStreamChatGenerics> | undefined
  >(undefined);
  const [myState, setMyState] = useState<DiscordState>(initialValue);

  // Restore once on mount
  useEffect(() => {
    const saved = localStorage.getItem('discord_servers');
    console.log('Restoring from localStorage:', saved);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as DiscordServer[];
        setServers(
          Array.isArray(parsed)
            ? parsed.map((s) => ({ ...s, id: s.id ?? crypto.randomUUID() }))
            : []
        );
      } catch {
        setServers([]);
      }
    }
  }, []);

  // Save whenever servers change
  useEffect(() => {
    console.log('Saving to localStorage:', servers);
    localStorage.setItem('discord_servers', JSON.stringify(servers));
  }, [servers]);

  const changeServer = useCallback(
    async (server: DiscordServer | undefined, client: StreamChat) => {
      const filterServerName = server?.name;

      const channels =
        server && filterServerName
          ? await client.queryChannels({
              type: 'messaging',
              team: filterServerName,
            })
          : await client.queryChannels({
              type: 'messaging',
              members: { $in: [client.userID as string] },
            });

      const channelsByCategories = new Map<
        string,
        Array<Channel<DefaultStreamChatGenerics>>
      >();
      if (server && filterServerName) {
        const categories = new Set(
          channels
            .map((ch) => (ch.data as Record<string, unknown>)?.category as string | undefined)
            .filter((c): c is string => c != null && c !== '')
        );
        for (const category of categories) {
          channelsByCategories.set(
            category,
            channels.filter(
              (ch) => (ch.data as Record<string, unknown>)?.category === category
            )
          );
        }
      } else {
        channelsByCategories.set('Direct Messages', channels);
      }
      setMyState((prev) => ({ ...prev, server, channelsByCategories }));
    },
    [setMyState]
  );

  const createCall = useCallback(
    async (
      client: StreamVideoClient,
      server: DiscordServer,
      channelName: string,
      userIds: string[]
    ) => {
      const callId = uuid();
      const audioCall = client.call('default', callId);
      const audioChannelMembers: MemberRequest[] = userIds.map((userId) => ({
        user_id: userId,
      }));
      const createdAudioCall = await audioCall.create({
        data: {
          custom: {
            serverName: server?.name,
            callName: channelName,
          },
          members: audioChannelMembers,
        },
      });
      setMyState((s) => ({ ...s, callId: createdAudioCall.call.id }));
    },
    [setMyState]
  );

  const createServer = useCallback(
    async (name: string, imageUrl?: string): Promise<DiscordServer> => {
      const newServer: DiscordServer = {
        name,
        image: imageUrl ?? '',
      };
      setMyState((prev) => ({
        ...prev,
        server: newServer,
      }));
      return newServer;
    },
    []
  );

  const createChannel = useCallback(
    async (client: StreamChat, name: string, category: string) => {
      if (!client || !myState.server?.name) return;

      const serverName = myState.server.name;
      const channelId = `${serverName}-${name}-${Date.now()}`;

      const channel = client.channel('messaging', channelId, {
        name,
        team: serverName,
        category,
        created_by_id: client.userID,
      });

      await channel.create();
      await changeServer(myState.server, client);
    },
    [myState.server, changeServer]
  );

  const inviteUsersToServer = useCallback(
    async (
      client: StreamChat,
      serverName: string,
      userIds: string[]
    ) => {
      if (!userIds || userIds.length === 0) {
        throw new Error('At least one user must be selected to invite');
      }

      try {
        const channels = await client.queryChannels({
          type: 'messaging',
          team: serverName,
        });

        const serverChannels = channels;

        if (serverChannels.length === 0) {
          throw new Error(`No channels found for server: ${serverName}`);
        }

        const addMemberPromises = serverChannels.map(async (channel) => {
          try {
            await channel.addMembers(userIds);
          } catch {
            // Continue with other channels even if one fails
          }
        });

        await Promise.all(addMemberPromises);

        if (myState.server && myState.server.name === serverName) {
          await changeServer(myState.server, client);
        }
      } catch (err) {
        throw err;
      }
    },
    [changeServer, myState.server]
  );

  const setCall = useCallback(
    (callId: string | undefined) => {
      setMyState((myState) => {
        return { ...myState, callId };
      });
    },
    [setMyState]
  );

  const store: DiscordState = {
    server: myState.server,
    servers,
    setServers,
    createChannelModalOpen,
    setCreateChannelModalOpen,
    callId: myState.callId,
    activeCall,
    setActiveCall,
    lastActiveChannel,
    setLastActiveChannel,
    channelsByCategories: myState.channelsByCategories,
    changeServer: changeServer,
    createServer: createServer,
    createChannel: createChannel,
    createCall: createCall,
    inviteUsersToServer: inviteUsersToServer,
    setCall: setCall,
  };

  return (
    <DiscordContext.Provider value={store}>{children}</DiscordContext.Provider>
  );
};

export const useDiscordContext = () => useContext(DiscordContext);
