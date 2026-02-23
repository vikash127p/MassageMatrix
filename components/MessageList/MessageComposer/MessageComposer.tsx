import {
  CloseIcon,
  Emoji,
  GIF,
  Paperclip,
  PlusCircle,
  Present,
} from '@/components/ChannelList/Icons';
import { useRef, useState } from 'react';
import { SendButton, useChatContext } from 'stream-chat-react';
import { plusItems } from './plusItems';
import ChannelListMenuRow from '@/components/ChannelList/TopBar/ChannelListMenuRow';
import {
  ALLOWED_ACCEPT,
  isImageType,
  validateFile,
} from './uploadConstants';

type PendingAttachment = {
  id: string;
  file: File;
  previewUrl?: string;
  type: 'image' | 'file';
};

export default function MessageComposer(): JSX.Element {
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const { channel } = useChatContext();
  const [message, setMessage] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileInput = () => {
    setUploadError(null);
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    const next: PendingAttachment[] = [];
    let error: string | null = null;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = validateFile(file);
      if (!result.valid) {
        error = result.error;
        break;
      }
      const id = `${file.name}-${Date.now()}-${i}`;
      const type = isImageType(file.type) ? 'image' : 'file';
      const previewUrl = type === 'image' ? URL.createObjectURL(file) : undefined;
      next.push({ id, file, previewUrl, type });
    }

    if (error) {
      setUploadError(error);
      e.target.value = '';
      return;
    }

    setUploadError(null);
    setPendingAttachments((prev) => [...prev, ...next]);
    e.target.value = '';
  };

  const removeAttachment = (id: string) => {
    setPendingAttachments((prev) => {
      const item = prev.find((a) => a.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((a) => a.id !== id);
    });
  };

  const canSend =
    (message.trim().length > 0 || pendingAttachments.length > 0) && !isUploading;

  const handleSend = async () => {
    if (!canSend || !channel) return;

    if (pendingAttachments.length > 0) {
      setIsUploading(true);
      setUploadError(null);

      try {
        const attachments: Array<{
          type: string;
          asset_url: string;
          thumb_url?: string;
          title?: string;
        }> = [];

        for (const { file, type } of pendingAttachments) {
          if (type === 'image') {
            const res = await channel.sendImage(file, file.name, file.type);
            attachments.push({
              type: 'image',
              asset_url: res.file,
              thumb_url: res.file,
            });
          } else {
            const res = await channel.sendFile(file, file.name, file.type);
            attachments.push({
              type: 'file',
              asset_url: res.file,
              title: file.name,
            });
          }
        }

        await channel.sendMessage({
          text: message.trim() || undefined,
          attachments,
        });

        setMessage('');
        setPendingAttachments((prev) => {
          prev.forEach((a) => {
            if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
          });
          return [];
        });
      } catch (err) {
        setUploadError(
          err instanceof Error ? err.message : 'Upload failed. Please try again.'
        );
      } finally {
        setIsUploading(false);
      }
      return;
    }

    if (message.trim()) {
      channel.sendMessage({ text: message });
      setMessage('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  const handlePlusOptionClick = (optionName: string) => {
    if (optionName === 'Upload a File') {
      triggerFileInput();
    }
    setPlusMenuOpen(false);
  };

  return (
    <div className='mx-6 my-6'>
      {uploadError && (
        <div
          className='mb-2 px-3 py-2 rounded-md bg-red-50 text-red-700 text-sm'
          role='alert'
        >
          {uploadError}
        </div>
      )}
      {pendingAttachments.length > 0 && (
        <div className='mb-2 flex flex-wrap gap-2'>
          {pendingAttachments.map((att) => (
            <div
              key={att.id}
              className='relative inline-flex items-center gap-1 bg-composer-gray rounded-md overflow-hidden border border-gray-200'
            >
              {att.type === 'image' && att.previewUrl ? (
                <img
                  src={att.previewUrl}
                  alt={att.file.name}
                  className='h-14 w-14 object-cover'
                />
              ) : (
                <span className='px-2 py-2 text-xs font-medium text-gray-700 max-w-[120px] truncate'>
                  {att.file.name}
                </span>
              )}
              <button
                type='button'
                onClick={() => removeAttachment(att.id)}
                className='p-1 hover:bg-gray-200 rounded-full'
                aria-label='Remove attachment'
              >
                <CloseIcon className='w-4 h-4' />
              </button>
            </div>
          ))}
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className='flex px-4 py-1 bg-composer-gray items-center justify-center space-x-4 rounded-md text-gray-600 relative'
      >
        <input
          ref={fileInputRef}
          type='file'
          accept={ALLOWED_ACCEPT}
          multiple
          className='hidden'
          onChange={handleFileSelect}
          aria-label='Upload file or image'
        />
        <button
          type='button'
          onClick={() => setPlusMenuOpen((open) => !open)}
          aria-label='More options'
        >
          <PlusCircle className='w-8 h-8 hover:text-gray-800' />
        </button>
        <button
          type='button'
          onClick={triggerFileInput}
          aria-label='Upload file or image'
        >
          <Paperclip className='w-8 h-8 hover:text-gray-800' />
        </button>
        {plusMenuOpen && (
          <div className='absolute p-2 z-10 -left-6 bottom-12'>
            <div className='bg-white p-2 shadow-lg rounded-md w-40 flex flex-col'>
              {plusItems.map((option) => (
                <button
                  key={option.name}
                  type='button'
                  className=''
                  onClick={() => handlePlusOptionClick(option.name)}
                >
                  <ChannelListMenuRow {...option} />
                </button>
              ))}
            </div>
          </div>
        )}
        <input
          className='border-transparent bg-transparent outline-none text-sm font-semibold m-0 text-gray-normal flex-1 min-w-0'
          type='text'
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder='Message #general'
          disabled={isUploading}
        />
        <Present className='w-8 h-8 hover:text-gray-800 flex-shrink-0' />
        <GIF className='w-8 h-8 hover:text-gray-800 flex-shrink-0' />
        <Emoji className='w-8 h-8 hover:text-gray-800 flex-shrink-0' />
        <span className='relative flex-shrink-0'>
          {isUploading && (
            <span
              className='absolute inset-0 flex items-center justify-center bg-composer-gray rounded'
              aria-hidden
            >
              <span className='h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin' />
            </span>
          )}
          <SendButton sendMessage={handleSend} disabled={!canSend} />
        </span>
      </form>
    </div>
  );
}
