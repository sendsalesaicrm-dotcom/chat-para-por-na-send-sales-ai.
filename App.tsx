
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import { Contact } from './types';

const App: React.FC = () => {
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);

  // Handle contact selection
  const handleSelectContact = (contact: Contact) => {
    setActiveContactId(contact.id);
    setActiveContact(contact);
  };

  // Solicitar permissão de notificação ao carregar
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="flex h-screen w-full bg-[#f0f2f5] overflow-hidden antialiased">
      <Sidebar 
        activeContactId={activeContactId}
        onSelectContact={handleSelectContact}
      />
      <div className="flex-1 flex flex-col h-full bg-white border-l border-gray-200">
        <ChatWindow 
          contact={activeContact}
        />
      </div>
    </div>
  );
};

export default App;
