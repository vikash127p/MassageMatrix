import { useChatContext } from 'stream-chat-react';
import { useDiscordContext } from '@/contexts/DiscordContext';
import { useCall } from '@stream-io/video-react-bindings';
import { CallingState } from '@stream-io/video-client';
import {
  useCallStateHooks,
  StreamTheme,
  SpeakerLayout,
  CallControls,
  CallParticipantsList,
} from '@stream-io/video-react-sdk';

export default function CallLayout(): JSX.Element {
  const { setActiveCall, lastActiveChannel } = useDiscordContext();
  const { setActiveChannel } = useChatContext();
  const call = useCall();
  const { useCallCallingState, useParticipantCount } = useCallStateHooks();
  const participantCount = useParticipantCount();
  const callingState = useCallCallingState();

  console.log('Calling state:', callingState);

  const handleLeave = async () => {
    if (!call) return;

    // Prevent double leave
    if (
      call.state.callingState === CallingState.LEFT ||
      call.state.callingState === CallingState.IDLE
    ) {
      setActiveCall(undefined);
      if (lastActiveChannel) {
        setActiveChannel(lastActiveChannel);
      }
      return;
    }

    try {
      await call.leave();
    } catch (err) {
      console.warn('Leave error ignored:', err);
    }

    setActiveCall(undefined);
    if (lastActiveChannel) {
      setActiveChannel(lastActiveChannel);
    }
  };

  if (callingState !== CallingState.JOINED) {
    console.log('Call object (not joined):', call);
    return (
      <div className='w-full h-full flex items-center justify-center text-xl font-semibold animate-pulse'>
        Joining call...
      </div>
    );
  }

  return (
    <StreamTheme>
      <div className='flex flex-col h-full w-full'>
        <SpeakerLayout participantsBarPosition='bottom' />
        <CallParticipantsList onClose={() => {}} />
        <CallControls onLeave={handleLeave} />
      </div>
    </StreamTheme>
  );
}
