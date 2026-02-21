import { ChannelListMessengerProps, useChatContext } from 'stream-chat-react';
import { useStreamVideoClient } from '@stream-io/video-react-sdk';

import { useDiscordContext } from '@/contexts/DiscordContext';
import CreateChannelForm from './CreateChannelForm/CreateChannelForm';
import UserBar from './BottomBar/ChannelListBottomBar';
import ChannelListTopBar from './TopBar/ChannelListTopBar';
import CategoryItem from './CategoryItem/CategoryItem';
import CallList from './CallList/CallList';
import InviteForm from '@/components/ServerList/InviteForm';
import { PlusIcon } from './Icons';

const CustomChannelList: React.FC<ChannelListMessengerProps> = () => {
  const {
    server,
    channelsByCategories,
    setCreateChannelModalOpen,
    setActiveCall,
    setLastActiveChannel,
    setUnreadByChannel,
    unreadByChannel,
    activeCall,
  } = useDiscordContext();
  const { setActiveChannel, activeChannel } = useChatContext();
  const videoClient = useStreamVideoClient();

  const isServerSelected = Boolean(server?.name);
  const serverName = server?.name;

  const textChannels = (
    channelsByCategories.get('Text Channels') ?? []
  ).filter(
    (c) =>
      (c.data as Record<string, unknown>)?.category === 'Text Channels' &&
      (c.data as Record<string, unknown>)?.team === serverName
  );
  const voiceChannels = (
    channelsByCategories.get('Voice Channels') ?? []
  ).filter(
    (c) =>
      (c.data as Record<string, unknown>)?.category === 'Voice Channels' &&
      (c.data as Record<string, unknown>)?.team === serverName
  );

  return (
    <div className='w-72 bg-medium-gray h-full flex flex-col items-start'>
      <ChannelListTopBar serverName={server?.name || 'Direct Messages'} />

      <div className='w-full'>
        {isServerSelected ? (
          <>
            <div className='mb-5'>
              <div className='flex items-center text-gray-500 p-2'>
                <h2 className='inline-block uppercase text-sm font-bold px-2'>
                  TEXT CHANNELS
                </h2>
                <button
                  type='button'
                  className='inline-flex ml-auto'
                  onClick={() => setCreateChannelModalOpen(true)}
                  aria-label='Create channel'
                >
                  <PlusIcon />
                </button>
              </div>
              <div>
                {textChannels.map((channel) => {
                  const unread = unreadByChannel[channel.id] ?? 0;
                  return (
                    <div
                      key={channel.id}
                      role='button'
                      tabIndex={0}
                      onClick={() => {
                        setLastActiveChannel(channel);
                        setActiveChannel(channel);
                        setUnreadByChannel((prev) => ({ ...prev, [channel.id]: 0 }));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setLastActiveChannel(channel);
                          setActiveChannel(channel);
                          setUnreadByChannel((prev) => ({ ...prev, [channel.id]: 0 }));
                        }
                      }}
                      className={`channel-item w-full flex items-center mx-2 px-2 py-1 text-sm hover:bg-gray-200 rounded-md cursor-pointer ${
                        activeChannel?.id === channel.id ? 'active bg-gray-200 font-semibold' : ''
                      }`}
                    >
                      <span className='italic text-xl mr-2 text-gray-500'>#</span>
                      <span>{channel.data?.name ?? 'Channel'}</span>
                      {unread > 0 && (
                        <span className='ml-2 bg-red-500 text-white text-xs px-2 rounded-full'>
                          {unread}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className='mb-5'>
              <div className='flex items-center text-gray-500 p-2'>
                <h2 className='inline-block uppercase text-sm font-bold px-2'>
                  VOICE CHANNELS
                </h2>
                <button
                  type='button'
                  className='inline-flex ml-auto'
                  onClick={() => setCreateChannelModalOpen(true)}
                  aria-label='Create voice channel'
                >
                  <PlusIcon />
                </button>
              </div>
              <div>
                {voiceChannels.map((channel) => (
                  <div
                    key={channel.id}
                    role='button'
                    tabIndex={0}
                    onClick={async () => {
                      if (!videoClient) return;
                      console.log('Creating call:', channel.id);
                      const call = videoClient.call('default', channel.id);
                      await call.join({ create: true });
                      console.log('Call joined:', call.state.callingState);
                      setActiveCall(call);
                    }}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (!videoClient) return;
                        console.log('Creating call:', channel.id);
                        const call = videoClient.call('default', channel.id);
                        await call.join({ create: true });
                        console.log('Call joined:', call.state.callingState);
                        setActiveCall(call);
                      }
                    }}
                    className={`channel-item w-full flex items-center mx-2 px-2 py-1 text-sm hover:bg-gray-200 rounded-md cursor-pointer ${
                      activeCall?.id === channel.id ? 'active bg-gray-200 font-semibold' : ''
                    }`}
                  >
                    <span className='mr-2' aria-hidden>
                      🔊
                    </span>
                    <span>{channel.data?.name ?? 'Voice'}</span>
                  </div>
                ))}
              </div>
              <CallList hideHeader />
            </div>
          </>
        ) : (
          Array.from(channelsByCategories.keys()).map((category, index) => (
            <CategoryItem
              key={`${category}-${index}`}
              category={category}
              serverName={server?.name || 'Direct Messages'}
              channels={channelsByCategories.get(category) || []}
            />
          ))
        )}
      </div>
      <CreateChannelForm />
      <InviteForm />
      <UserBar />
    </div>
  );
};

export default CustomChannelList;
