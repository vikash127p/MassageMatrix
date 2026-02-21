import { UserObject } from '@/model/UserObject';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useChatContext } from 'stream-chat-react';
import { CloseMark } from '../ChannelList/Icons';
import UserRow from '../ChannelList/CreateChannelForm/UserRow';
import { useDiscordContext } from '@/contexts/DiscordContext';
import { DiscordServer } from '@/app/page';

type FormState = {
  serverName: string;
  serverImage: string;
  users: UserObject[];
};

type CreateServerFormProps = {
  onCreateServer: (name: string, imageUrl?: string) => void;
};

const CreateServerForm = ({ onCreateServer }: CreateServerFormProps) => {
  const router = useRouter();
  const params = useSearchParams();
  const showCreateServerForm = params.get('createServer');
  const dialogRef = useRef<HTMLDialogElement>(null);

  const { client } = useChatContext();
  const { setServers, changeServer } = useDiscordContext();
  const initialState: FormState = {
    serverName: '',
    serverImage: '',
    users: [],
  };

  const [formData, setFormData] = useState<FormState>(initialState);
  const [users, setUsers] = useState<UserObject[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const loadUsers = useCallback(async () => {
    const response = await client.queryUsers({});
    const users: UserObject[] = response.users
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
    if (users) setUsers(users);
  }, [client]);

  useEffect(() => {
    if (showCreateServerForm && dialogRef.current) {
      dialogRef.current.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [showCreateServerForm]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const serverName = formData.serverName.trim();
    const serverImage =
      formData.serverImage.trim() ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(serverName)}&background=5865F2&color=fff&size=128`;

    if (!serverName.trim()) return;

    const newServer: DiscordServer = {
      id: crypto.randomUUID(),
      name: serverName.trim(),
      image: serverImage ?? '',
    };

    setServers((prev) => [...prev, newServer]);

    if (client) {
      changeServer(newServer, client);
    }

    setFormData(initialState);
    dialogRef.current?.close();
    router.replace('/');
  };

  return (
    <dialog className='absolute z-10 space-y-2 rounded-xl' ref={dialogRef}>
      <div className='w-full flex items-center justify-between py-8 px-6'>
        <h2 className='text-3xl font-semibold text-gray-600'>
          Create new server
        </h2>
        <Link href='/'>
          <CloseMark className='w-10 h-10 text-gray-400' />
        </Link>
      </div>
      <form className='flex flex-col space-y-2 px-6' onSubmit={handleSubmit}>
        <label className='labelTitle' htmlFor='serverName'>
          Server Name
        </label>
        <div className='flex items-center bg-gray-100'>
          <span className='text-2xl p-2 text-gray-500'>#</span>
          <input
            type='text'
            id='serverName'
            name='serverName'
            value={formData.serverName}
            onChange={(e) =>
              setFormData({ ...formData, serverName: e.target.value })
            }
            required
          />
        </div>
        <label className='labelTitle' htmlFor='serverImage'>
          Image URL <span className='text-sm text-gray-400 font-normal'>(Optional)</span>
        </label>
        <div className='flex items-center bg-gray-100'>
          <span className='text-2xl p-2 text-gray-500'>#</span>
          <input
            type='text'
            id='serverImage'
            name='serverImage'
            value={formData.serverImage}
            onChange={(e) =>
              setFormData({ ...formData, serverImage: e.target.value })
            }
            placeholder='https://example.com/image.png or leave empty for default'
          />
        </div>
        <h2 className='mb-2 labelTitle'>
          Add Users <span className='text-sm text-gray-400 font-normal'>(Optional - you'll be added automatically)</span>
        </h2>
        <div className='max-h-64 overflow-y-scroll'>
          {users.length === 0 ? (
            <p className='text-gray-400 text-sm py-4'>No other users available</p>
          ) : (
            users.map((user) => (
              <UserRow
                user={user}
                userChanged={userChanged}
                checked={formData.users.some((u) => u.id === user.id)}
                key={user.id}
              />
            ))
          )}
        </div>
        <div className='flex space-x-6 items-center justify-end p-6 bg-gray-200'>
          <Link href={'/'} className='font-semibold text-gray-500'>
            Cancel
          </Link>
          <button
            type='submit'
            disabled={buttonDisabled()}
            className={`bg-discord rounded py-2 px-4 text-white font-bold uppercase ${
              buttonDisabled() ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Create Server
          </button>
        </div>
      </form>
    </dialog>
  );

  function buttonDisabled(): boolean {
    // Server name is required, but image URL can be optional (we'll use a default)
    // Users can be empty because we'll auto-include the current user
    return (
      isCreating ||
      !formData.serverName ||
      formData.serverName.trim() === ''
    );
  }

  function userChanged(user: UserObject, checked: boolean) {
    if (checked) {
      setFormData({
        ...formData,
        users: [...formData.users, user],
      });
    } else {
      setFormData({
        ...formData,
        users: formData.users.filter((thisUser) => thisUser.id !== user.id),
      });
    }
  }

};
export default CreateServerForm;
