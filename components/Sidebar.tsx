import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Contact } from '../types';

interface SidebarProps {
  onSelectContact: (contact: Contact) => void;
  activeContactId: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({ onSelectContact, activeContactId }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Busca inicial e Realtime
  useEffect(() => {
    const fetchContacts = async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('last_message_at', { ascending: false });
      
      if (data && !error) {
        const formatted: Contact[] = data.map((c: any) => ({
          id: c.id,
          name: c.name || c.phone,
          number: c.phone,
          phone: c.phone,
          // AQUI: Pegamos a coluna nova que criamos no SQL
          lastMessage: c.last_message_content || 'Nova mensagem', 
          last_message_at: c.last_message_at
        }));
        setContacts(formatted);
      }
    };

    fetchContacts();

    // Listener Realtime
    const channel = supabase
      .channel('realtime-contacts')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'contacts' }, 
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
             fetchContacts();
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.number && c.number.includes(searchTerm))
  );

  return (
    <div className="w-80 h-full bg-white border-r border-gray-200 flex flex-col shrink-0">
      {/* Header da Sidebar */}
      <div className="p-4 border-b border-gray-200 bg-indigo-600 text-white shrink-0">
        <h1 className="text-xl font-bold mb-3">Evolution Chat</h1>
        <div className="relative">
          <input 
            type="text"
            placeholder="Search contacts..."
            className="w-full bg-indigo-500/30 border-none rounded-lg py-1.5 px-3 text-sm placeholder-indigo-100 focus:ring-2 focus:ring-white outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Lista de Contatos */}
      <div className="flex-1 overflow-y-auto">
        {filteredContacts.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm italic">
            {searchTerm ? 'No results found.' : 'No contacts yet.'}
          </div>
        ) : (
          filteredContacts.map(contact => (
            <button
              key={contact.id}
              onClick={() => onSelectContact(contact)}
              className={`w-full p-4 flex items-center gap-3 border-b border-gray-100 transition-colors text-left ${
                activeContactId === contact.id ? 'bg-indigo-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold shrink-0 shadow-sm">
                {contact.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-baseline mb-0.5">
                    <span className="font-semibold text-gray-900 truncate">{contact.name}</span>
                    {contact.last_message_at && (
                      <span className="text-[10px] text-gray-400">
                        {new Date(contact.last_message_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    )}
                </div>
                <div className="text-xs text-gray-500 truncate">{contact.number}</div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default Sidebar;