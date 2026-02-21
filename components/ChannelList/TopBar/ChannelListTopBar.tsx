import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useChatContext } from 'stream-chat-react';
import { ChevronDown, CloseIcon, CloseMark } from '../Icons';
import ChannelListMenuRow from './ChannelListMenuRow';
import { menuItems } from './menuItems';
import { useDiscordContext } from '@/contexts/DiscordContext';

export default function ChannelListTopBar({
  serverName,
}: {
  serverName: string;
}): JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editImage, setEditImage] = useState('');
  const editDialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const params = useSearchParams();
  const { client } = useChatContext();
  const { server, servers, setServers, changeServer } = useDiscordContext();

  useEffect(() => {
    if (editModalOpen && server) {
      setEditName(server.name);
      setEditImage(server.image ?? '');
      editDialogRef.current?.showModal();
    } else {
      editDialogRef.current?.close();
    }
  }, [editModalOpen, server]);

  const handleLeaveServer = () => {
    if (!server) return;

    const updatedServers = servers.filter((s) => s.id !== server.id);
    setServers(updatedServers);

    if (client) {
      if (updatedServers.length > 0) {
        changeServer(updatedServers[0], client);
      } else {
        changeServer(undefined, client);
      }
    }
  };

  const handleEditServer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!server?.id) return;
    const newName = editName.trim();
    if (!newName) return;

    const newImage = editImage.trim() || '';

    setServers((prev) =>
      prev.map((s) =>
        s.id === server.id ? { ...s, name: newName, image: newImage } : s
      )
    );

    if (client) {
      const updatedServer = { ...server, name: newName, image: newImage };
      changeServer(updatedServer, client);
    }

    setEditModalOpen(false);
  };

  const handleMenuClick = (optionName: string) => {
    setMenuOpen(false);

    switch (optionName) {
      case 'Invite People':
        if (server) {
          router.push('/?invitePeople=true');
        } else {
          alert('Please select a server first to invite people.');
        }
        break;
      case 'Create Channel':
        if (server) {
          router.push('/?createChannel=true');
        } else {
          alert('Please select a server first to create a channel.');
        }
        break;
      case 'Create Category':
        // TODO: Implement create category functionality
        alert('Create Category feature coming soon!');
        break;
      case 'Server Settings':
        // TODO: Implement server settings
        alert('Server Settings feature coming soon!');
        break;
      case 'Edit Server Profile':
        if (server) {
          setEditModalOpen(true);
        } else {
          alert('Please select a server first.');
        }
        break;
      case 'Leave Server':
        if (confirm(`Are you sure you want to leave "${serverName}"?`)) {
          handleLeaveServer();
        }
        break;
      default:
        // Other menu items don't have actions yet
        break;
    }
  };

  return (
    <div className='w-full relative'>
      <dialog
        ref={editDialogRef}
        className='absolute z-20 space-y-2 rounded-xl p-0 min-w-[320px]'
        onCancel={() => setEditModalOpen(false)}
      >
        <div className='w-full flex items-center justify-between py-6 px-6 border-b border-gray-200'>
          <h2 className='text-xl font-semibold text-gray-700'>
            Edit Server Profile
          </h2>
          <button
            type='button'
            onClick={() => setEditModalOpen(false)}
            aria-label='Close'
          >
            <CloseMark className='w-8 h-8 text-gray-500 hover:text-gray-700' />
          </button>
        </div>
        <form
          onSubmit={handleEditServer}
          className='flex flex-col space-y-4 px-6 py-4'
        >
          <label className='labelTitle' htmlFor='edit-server-name'>
            Server name
          </label>
          <input
            id='edit-server-name'
            type='text'
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
            required
          />
          <label className='labelTitle' htmlFor='edit-server-image'>
            Icon URL <span className='text-sm text-gray-400 font-normal'>(optional)</span>
          </label>
          <input
            id='edit-server-image'
            type='text'
            value={editImage}
            onChange={(e) => setEditImage(e.target.value)}
            placeholder='https://example.com/icon.png'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
          />
          <div className='flex justify-end gap-2 pt-2'>
            <button
              type='button'
              onClick={() => setEditModalOpen(false)}
              className='px-4 py-2 text-gray-600 hover:text-gray-800'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={!editName.trim()}
              className='px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Save
            </button>
          </div>
        </form>
      </dialog>

      <button
        className={`flex w-full items-center justify-between p-4 border-b-2 ${
          menuOpen ? 'bg-gray-300' : ''
        } border-gray-300 hover:bg-gray-300`}
        onClick={() => setMenuOpen((currentValue) => !currentValue)}
      >
        <h2 className='text-lg font-bold text-gray-700'>{serverName}</h2>
        {menuOpen && <CloseIcon />}
        {!menuOpen && <ChevronDown />}
      </button>

      {menuOpen && (
        <div className='absolute w-full p-2 z-10'>
          <div className='w-full bg-white p-2 shadow-lg rounded-md'>
            {menuItems.map((option) => (
              <button
                key={option.name}
                className='w-full'
                onClick={() => handleMenuClick(option.name)}
              >
                <ChannelListMenuRow {...option} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
