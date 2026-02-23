import {
  ReactionSelector,
  ReactionsList,
  useMessageContext,
} from 'stream-chat-react';
import Image from 'next/image';
import { useState } from 'react';
import MessageOptions from './MessageOptions';

export default function CustomMessage(): JSX.Element {
  const { message } = useMessageContext();
  const [showOptions, setShowOptions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  return (
    <div
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={() => setShowOptions(false)}
      className='flex relative space-x-2 p-2 rounded-md transition-colors ease-in-out duration-200 hover:bg-gray-100'
    >
      <Image
        className='rounded-full aspect-square object-cover w-10 h-10'
        width={40}
        height={40}
        src={message.user?.image || 'https://getstream.io/random_png/'}
        alt='User avatar'
      />
      <div>
        {showOptions && (
          <MessageOptions showEmojiReactions={setShowReactions} />
        )}
        {showReactions && (
          <div className='absolute'>
            <ReactionSelector />
          </div>
        )}
        <div className='space-x-2'>
          <span className='font-semibold text-sm text-black'>
            {message.user?.name}
          </span>
          {message.updated_at && (
            <span className='text-xs text-gray-600'>
              {formatDate(message.updated_at)}
            </span>
          )}
        </div>
        <p className='text-sm text-gray-700'>{message.text}</p>
        {message.attachments && message.attachments.length > 0 && (
          <div className='mt-1 flex flex-col gap-2'>
            {message.attachments.map((attachment, idx) => {
              const url = attachment.asset_url;
              const type = attachment.type || 'file';
              if (type === 'image' && url) {
                return (
                  <a
                    key={idx}
                    href={url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='block max-w-sm rounded overflow-hidden border border-gray-200'
                  >
                    <img
                      src={attachment.thumb_url || url}
                      alt={attachment.title || 'Image attachment'}
                      className='max-h-64 w-auto object-contain'
                    />
                  </a>
                );
              }
              if (url) {
                return (
                  <a
                    key={idx}
                    href={url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-sm text-dark-discord hover:underline'
                  >
                    {attachment.title || 'File attachment'}
                  </a>
                );
              }
              return null;
            })}
          </div>
        )}
        <ReactionsList />
      </div>
    </div>
  );

  function formatDate(date: Date | string): string {
    if (typeof date === 'string') {
      return date;
    }
    return `${date.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })}`;
  }
}
