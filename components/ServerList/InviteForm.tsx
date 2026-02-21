import { useDiscordContext } from '@/contexts/DiscordContext';
import { UserObject } from '@/model/UserObject';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useChatContext } from 'stream-chat-react';
import { CloseMark } from '../ChannelList/Icons';
import UserRow from '../ChannelList/CreateChannelForm/UserRow';

const InviteForm = () => {
  const params = useSearchParams();
  const showInviteForm = params.get('invitePeople');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  const { client } = useChatContext();
  const { server, inviteUsersToServer } = useDiscordContext();
  const [users, setUsers] = useState<UserObject[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserObject[]>([]);
  const [isInviting, setIsInviting] = useState(false);

  const loadUsers = useCallback(async () => {
    if (!client) return;
    
    try {
      const response = await client.queryUsers({});
      const allUsers: UserObject[] = response.users
        .filter((user) => user.role !== 'admin')
        .map((user) => {
          return {
            id: user.id,
            name: user.name ?? user.id,
            image: user.image as string,
            online: user.online,
            lastOnline: user.last_active,
          };
        });

      // Filter out users who are already members of the server
      if (server) {
        const serverChannels = await client.queryChannels({
          type: 'messaging',
          members: { $in: [client.userID as string] },
        });

        const existingMemberIds = new Set<string>();
        const getChannelTeam = (ch: { data?: Record<string, unknown> }) => {
          const d = ch.data;
          if (!d) return undefined;
          const v = d.team ?? (d.data as Record<string, unknown> | undefined)?.team;
          return v != null ? String(v) : undefined;
        };
        serverChannels.forEach((channel) => {
          if (getChannelTeam(channel) === server.name) {
            const members = Object.keys(channel.state.members || {});
            members.forEach((memberId) => existingMemberIds.add(memberId));
          }
        });

        const availableUsers = allUsers.filter(
          (user) => !existingMemberIds.has(user.id)
        );
        setUsers(availableUsers);
      } else {
        setUsers(allUsers);
      }
    } catch (error) {
      console.error('[InviteForm] Error loading users:', error);
    }
  }, [client, server]);

  useEffect(() => {
    if (showInviteForm && dialogRef.current) {
      dialogRef.current.showModal();
      loadUsers();
    } else {
      dialogRef.current?.close();
    }
  }, [showInviteForm, loadUsers]);

  useEffect(() => {
    if (showInviteForm) {
      setSelectedUsers([]);
    }
  }, [showInviteForm]);

  function userChanged(user: UserObject, checked: boolean) {
    if (checked) {
      setSelectedUsers((prev) => [...prev, user]);
    } else {
      setSelectedUsers((prev) => prev.filter((u) => u.id !== user.id));
    }
  }

  async function inviteClicked(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();

    if (!server) {
      alert('Please select a server first.');
      return;
    }

    if (selectedUsers.length === 0) {
      alert('Please select at least one user to invite.');
      return;
    }

    if (!client) {
      alert('Chat client not available. Please refresh the page.');
      return;
    }

    setIsInviting(true);
    try {
      const userIds = selectedUsers.map((user) => user.id);
      console.log('[InviteForm] Inviting users:', userIds);
      
      await inviteUsersToServer(client, server.name, userIds);
      
      console.log('[InviteForm] Invitation completed');
      setSelectedUsers([]);
      router.replace('/');
    } catch (error) {
      console.error('[InviteForm] Error inviting users:', error);
      alert(
        `Failed to invite users: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsInviting(false);
    }
  }

  if (!server) {
    return null; // Don't show invite form if no server is selected
  }

  return (
    <dialog className='absolute z-10 space-y-2 rounded-xl' ref={dialogRef}>
      <div className='w-full flex items-center justify-between py-8 px-6'>
        <h2 className='text-3xl font-semibold text-gray-600'>
          Invite People to {server.name}
        </h2>
        <Link href='/'>
          <CloseMark className='w-10 h-10 text-gray-400' />
        </Link>
      </div>
      <form className='flex flex-col space-y-2 px-6' onSubmit={(e) => e.preventDefault()}>
        <p className='text-gray-500 text-sm mb-4'>
          Select users to invite to this server. They will be added to all channels in the server.
        </p>
        <h2 className='mb-2 labelTitle'>Select Users</h2>
        <div className='max-h-64 overflow-y-scroll'>
          {users.length === 0 ? (
            <p className='text-gray-400 text-sm py-4'>
              No users available to invite (all users are already members)
            </p>
          ) : (
            users.map((user) => (
              <UserRow
                user={user}
                userChanged={userChanged}
                checked={selectedUsers.some((u) => u.id === user.id)}
                key={user.id}
              />
            ))
          )}
        </div>
        {selectedUsers.length > 0 && (
          <p className='text-sm text-gray-600 mt-2'>
            {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
          </p>
        )}
      </form>
      <div className='flex space-x-6 items-center justify-end p-6 bg-gray-200'>
        <Link href={'/'} className='font-semibold text-gray-500'>
          Cancel
        </Link>
        <button
          type='button'
          disabled={isInviting || selectedUsers.length === 0}
          className={`bg-discord rounded py-2 px-4 text-white font-bold uppercase ${
            isInviting || selectedUsers.length === 0
              ? 'opacity-50 cursor-not-allowed'
              : ''
          }`}
          onClick={inviteClicked}
        >
          {isInviting ? 'Inviting...' : `Invite ${selectedUsers.length > 0 ? `(${selectedUsers.length})` : ''}`}
        </button>
      </div>
    </dialog>
  );
};

export default InviteForm;
