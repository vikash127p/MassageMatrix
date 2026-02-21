import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, CloseIcon } from '../Icons';
import ChannelListMenuRow from './ChannelListMenuRow';
import { menuItems } from './menuItems';
import { useDiscordContext } from '@/contexts/DiscordContext';

export default function ChannelListTopBar({
  serverName,
}: {
  serverName: string;
}): JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const { server } = useDiscordContext();

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
      case 'Leave Server':
        if (confirm(`Are you sure you want to leave "${serverName}"?`)) {
          // TODO: Implement leave server functionality
          alert('Leave Server feature coming soon!');
        }
        break;
      default:
        // Other menu items don't have actions yet
        break;
    }
  };

  return (
    <div className='w-full relative'>
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
