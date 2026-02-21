import { UserObject } from '@/model/UserObject';
import { useDiscordContext } from '@/contexts/DiscordContext';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useChatContext } from 'stream-chat-react';
import { CloseMark, Speaker } from '../Icons';
import UserRow from './UserRow';

type FormState = {
  channelType: 'text' | 'voice';
  channelName: string;
  users: UserObject[];
};

export default function CreateChannelForm(): JSX.Element {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { client } = useChatContext();
  const {
    server,
    createChannel,
    createChannelModalOpen,
    setCreateChannelModalOpen,
  } = useDiscordContext();

  const initialState: FormState = {
    channelType: 'text',
    channelName: '',
    users: [],
  };
  const [formData, setFormData] = useState<FormState>(initialState);
  const [users, setUsers] = useState<UserObject[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const loadUsers = useCallback(async () => {
    const response = await fetch('/api/users');
    const data = (await response.json())?.data as UserObject[];
    if (data) setUsers(data);
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (createChannelModalOpen && dialogRef.current) {
      dialogRef.current.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [createChannelModalOpen]);

  const handleClose = () => {
    setCreateChannelModalOpen(false);
  };

  return (
    <>
      {createChannelModalOpen && (
        <dialog
          className="absolute z-10 space-y-2 rounded-xl"
          ref={dialogRef}
          onClose={handleClose}
        >
          <div className="w-full flex items-center justify-between py-8 px-6">
            <h2 className="text-3xl font-semibold text-gray-600">
              Create Channel
            </h2>
            <button
              type="button"
              onClick={handleClose}
              className="p-1"
              aria-label="Close"
            >
              <CloseMark className="w-10 h-10 text-gray-400" />
            </button>
          </div>
          <form
            className="flex flex-col space-y-4 px-6"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="space-y-4">
              <h3 className="labelTitle">Channel Type</h3>
              <div className="w-full flex space-x-4 items-center bg-gray-100 px-4 py-2 rounded-md">
                <label
                  htmlFor="text"
                  className="flex flex-1 items-center space-x-6"
                >
                  <span className="text-4xl text-gray-400">#</span>
                  <div>
                    <p className="text-lg text-gray-700 font-semibold">Text</p>
                    <p className="text-gray-500">
                      Send messages, images, GIFs, emoji, opinions, and puns
                    </p>
                  </div>
                </label>
                <input
                  type="radio"
                  id="text"
                  name="channelType"
                  value="text"
                  checked={formData.channelType === 'text'}
                  onChange={() =>
                    setFormData({ ...formData, channelType: 'text' })
                  }
                />
              </div>
              <div className="w-full flex space-x-4 items-center bg-gray-100 px-4 py-2 rounded-md">
                <label
                  htmlFor="voice"
                  className="flex flex-1 items-center space-x-4"
                >
                  <Speaker className="text-gray-400 w-7 h-7" />
                  <div>
                    <p className="text-lg text-gray-700 font-semibold">Voice</p>
                    <p className="text-gray-500">
                      Hang out together with voice, video, and screen share
                    </p>
                  </div>
                </label>
                <input
                  type="radio"
                  id="voice"
                  name="channelType"
                  value="voice"
                  checked={formData.channelType === 'voice'}
                  onChange={() =>
                    setFormData({ ...formData, channelType: 'voice' })
                  }
                />
              </div>
            </div>
            <label className="labelTitle" htmlFor="channelName">
              Channel Name
            </label>
            <div className="flex items-center bg-gray-100">
              <span className="text-2xl p-2 text-gray-500">#</span>
              <input
                type="text"
                id="channelName"
                name="channelName"
                value={formData.channelName}
                onChange={(e) =>
                  setFormData({ ...formData, channelName: e.target.value })
                }
              />
            </div>
            <h2 className="mb-2 labelTitle">Add Users</h2>
            <div className="max-h-64 overflow-y-scroll">
              {users.map((user) => (
                <UserRow
                  user={user}
                  userChanged={userChanged}
                  checked={formData.users.some((u) => u.id === user.id)}
                  key={user.id}
                />
              ))}
            </div>
          </form>
          <div className="flex space-x-6 items-center justify-end p-6 bg-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="font-semibold text-gray-500"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={buttonDisabled()}
              className={`bg-discord rounded py-2 px-4 text-white font-bold uppercase ${
                buttonDisabled() ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={createClicked}
            >
              {isCreating ? 'Creating...' : 'Create Channel'}
            </button>
          </div>
        </dialog>
      )}
    </>
  );

  function buttonDisabled(): boolean {
    return (
      isCreating ||
      !formData.channelName?.trim() ||
      !client?.userID
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

  async function createClicked(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (!formData.channelName?.trim()) return;
    if (isCreating) return;

    if (!client) {
      alert('Chat client not available. Please refresh the page and try again.');
      return;
    }
    if (!client.userID) {
      alert('Please wait for the app to finish loading, then try again.');
      return;
    }
    if (!server?.name) {
      alert('Please select a server from the sidebar first.');
      return;
    }

    const name = formData.channelName.trim();
    setIsCreating(true);
    try {
      if (formData.channelType === 'text') {
        await createChannel(client, name, 'Text Channels');
      }
      if (formData.channelType === 'voice') {
        await createChannel(client, name, 'Voice Channels');
      }
      setFormData(initialState);
      setCreateChannelModalOpen(false);
    } catch (err) {
      alert(
        `Failed to create channel: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    } finally {
      setIsCreating(false);
    }
  }
}
