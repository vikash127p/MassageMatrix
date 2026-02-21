import { useChatContext } from 'stream-chat-react';
import { DiscordServer } from '@/app/page';
import { useDiscordContext } from '@/contexts/DiscordContext';
import CreateServerForm from './CreateServerForm';
import Link from 'next/link';

const ServerList = () => {
  const { client } = useChatContext();
  const { server: activeServer, changeServer, servers, setServers } =
    useDiscordContext();

  const handleCreateServer = (serverName: string, image?: string) => {
    if (!serverName.trim()) return;

    console.log('Creating server:', serverName);
    console.log('Servers BEFORE:', servers);

    const newServer: DiscordServer = {
      id: crypto.randomUUID(),
      name: serverName.trim(),
      image: image ?? '',
    };

    setServers((prev) => {
      console.log('Previous servers:', prev);
      const updated = [...prev, newServer];
      console.log('Updated servers:', updated);
      return updated;
    });

    if (client) {
      changeServer(newServer, client);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 py-3 bg-[#1E1F22] w-16 min-h-screen">
      <button
        className={`w-12 h-12 flex items-center justify-center rounded-full cursor-pointer transition-all duration-200 hover:rounded-2xl ${
          activeServer === undefined ? 'bg-[#4752C4] rounded-2xl' : 'bg-[#313338] hover:bg-[#4752C4]'
        }`}
        onClick={() => changeServer(undefined, client)}
        aria-label="Direct Messages"
      >
        <div className="rounded-icon discord-icon" />
      </button>
      <div className="flex flex-col items-center gap-3">
        {servers
          .filter((server) => typeof server.name === 'string')
          .map((server) => (
          <div
            key={server.id!}
            onClick={() => client && changeServer(server, client)}
            className="
              w-12 h-12
              flex items-center justify-center
              bg-[#5865F2]
              text-white
              font-bold
              rounded-full
              cursor-pointer
              transition-all duration-200
              hover:rounded-2xl
              hover:bg-[#4752C4]
            "
          >
            {server.name.charAt(0).toUpperCase()}
          </div>
          ))}
      </div>
      <Link
        href={'/?createServer=true'}
        className="w-12 h-12 flex items-center justify-center rounded-full bg-[#313338] text-green-500 hover:bg-green-600 hover:text-white hover:rounded-2xl transition-all duration-200 font-bold text-xl"
      >
        +
      </Link>
      <CreateServerForm onCreateServer={handleCreateServer} />
    </div>
  );
};

export default ServerList;
