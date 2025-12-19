
export interface Message {
  id: string;
  text: string;
  sender: 'me' | 'them';
  timestamp: Date;
  status: 'sending' | 'sent' | 'error';
  tempId?: string; // Used for optimistic UI reconciliation
}

export interface Contact {
  id: string; 
  name: string;
  number: string; // The Evolution API uses number
  phone?: string;  // Database often uses phone
  lastMessage?: string;
  last_message_at?: string;
}

export interface EvolutionApiMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message: {
    conversation?: string;
    extendedTextMessage?: {
      text: string;
    };
    imageMessage?: {
      caption?: string;
    };
  };
  messageTimestamp: number | string;
  status?: string;
  pushName?: string;
}
