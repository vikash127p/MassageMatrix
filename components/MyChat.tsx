import { useEffect } from 'react';
import { useClient } from '@/hooks/useClient';
import { User } from 'stream-chat';
import {
  Chat,
  Channel,
  ChannelList,
  MessageList,
  MessageInput,
  Thread,
  Window,
  useChatContext,
} from 'stream-chat-react';

import CustomChannelList from '@/components/ChannelList/CustomChannelList';
import ServerList from '@/components/ServerList/ServerList';
import MessageComposer from '@/components/MessageList/MessageComposer/MessageComposer';
import CustomDateSeparator from '@/components/MessageList/CustomDateSeparator/CustomDateSeparator';
import CustomMessage from '@/components/MessageList/CustomMessage/CustomMessage';
import { customReactionOptions } from '@/components/MessageList/CustomReactions/CustomReactionsSelector';
import { useVideoClient } from '@/hooks/useVideoClient';
import { StreamVideo, StreamCall } from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import { useDiscordContext } from '@/contexts/DiscordContext';
import CallLayout from '@/components/MyCall/CallLayout';
import CustomChannelHeader from './MessageList/CustomChannelHeader/CustomChannelHeader';

function UnreadListener() {
  const { client, channel: activeChannel } = useChatContext();
  const { setUnreadByChannel } = useDiscordContext();

  useEffect(() => {
    if (!client) return;

    const handleMessageNew = (event: { channel_id?: string; cid?: string }) => {
      const channelId = event.channel_id ?? (event.cid ? String(event.cid).split(':')[1] : undefined);
      if (!channelId || activeChannel?.id === channelId) return;

      setUnreadByChannel((prev) => ({
        ...prev,
        [channelId]: (prev[channelId] ?? 0) + 1,
      }));
    };

    client.on('message.new', handleMessageNew);
    return () => {
      client.off('message.new', handleMessageNew);
    };
  }, [client, activeChannel?.id, setUnreadByChannel]);

  return null;
}

export default function MyChat({
  apiKey,
  user,
  token,
}: {
  apiKey: string;
  user: User;
  token: string;
}) {
  const chatClient = useClient({
    apiKey,
    user,
    tokenOrProvider: token,
  });
  const videoClient = useVideoClient({
    apiKey,
    user,
    tokenOrProvider: token,
  });
  const { activeCall } = useDiscordContext();

  if (!chatClient) {
    return <div>Error, please try again later.</div>;
  }

  if (!videoClient) {
    return <div>Video Error, please try again later.</div>;
  }

  return (
    <StreamVideo client={videoClient}>
      <Chat client={chatClient} theme='str-chat__theme-light'>
        <UnreadListener />
        <section className='flex h-screen w-screen layout'>
          <ServerList />
          <ChannelList List={CustomChannelList} sendChannelsToList={true} />
          {activeCall ? (
            <StreamCall call={activeCall}>
              <CallLayout />
            </StreamCall>
          ) : (
            <Channel
              Message={CustomMessage}
              Input={MessageComposer}
              DateSeparator={CustomDateSeparator}
              reactionOptions={customReactionOptions}
              HeaderComponent={CustomChannelHeader}
            >
              <Window>
                <MessageList />
                <MessageInput />
              </Window>
              <Thread />
            </Channel>
          )}
        </section>
      </Chat>
    </StreamVideo>
  );
}
