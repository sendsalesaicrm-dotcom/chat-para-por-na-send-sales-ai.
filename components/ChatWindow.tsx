import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../services/supabase'; 
import { Contact, Message } from '../types';
import { sendTextMessage, fetchHistory } from '../services/evolutionService';

interface ChatWindowProps {
  contact: Contact | null;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ contact }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  };

  // 1. Carregar Dados
  useEffect(() => {
    if (!contact?.id) return;

    const loadData = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('contact_id', contact.id)
        .order('created_at', { ascending: true });

      if (data && data.length > 0) {
        setMessages(data.map((m: any) => ({
          id: m.id,
          text: m.content,
          sender: m.sender === 'client' ? 'them' : 'me',
          timestamp: new Date(m.created_at),
          status: 'sent'
        })));
        scrollToBottom();
      } else {
        // Fallback API Evolution (Opcional)
        try {
            const apiMessages = await fetchHistory(contact.number);
            const formatted = apiMessages.map((msg: any) => ({
                id: msg.key.id,
                text: msg.message?.conversation || 'Mídia/Outro',
                sender: msg.key.fromMe ? 'me' : 'them',
                timestamp: new Date(msg.messageTimestamp * 1000),
                status: 'sent'
            }));
            setMessages(formatted as Message[]);
        } catch (e) {
            console.log('Sem histórico na API');
        }
      }
    };
    loadData();
  }, [contact?.id]);

  // 2. Realtime
  useEffect(() => {
    if (!contact?.id) return;

    const channel = supabase.channel(`chat-${contact.id}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `contact_id=eq.${contact.id}` }, 
        (payload) => {
          const newMsg = payload.new;
          const senderType = newMsg.sender === 'client' ? 'them' : 'me';
          
          if (senderType === 'me') return; // Ignora minhas mensagens (já tratadas no envio)

          setMessages((prev) => {
             // Evita duplicatas
             if (prev.find(m => m.id === newMsg.id)) return prev;
             
             return [...prev, {
              id: newMsg.id,
              text: newMsg.content,
              sender: senderType,
              timestamp: new Date(newMsg.created_at),
              status: 'sent'
            }];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [contact?.id]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  // Enviar Mensagem
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !contact) return;

    const textToSend = inputText;
    setInputText("");

    const tempId = Math.random().toString();
    // Otimista
    setMessages(prev => [...prev, {
        id: tempId,
        text: textToSend,
        sender: 'me',
        timestamp: new Date(),
        status: 'sending'
    }]);

    try {
        await sendTextMessage(contact.number, textToSend);
        
        await supabase.from('messages').insert({
            contact_id: contact.id,
            content: textToSend,
            sender: 'me',
            created_at: new Date().toISOString()
        });
        
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'sent' } : m));
    } catch (error) {
        console.error(error);
        alert('Erro ao enviar');
    }
  };

  if (!contact) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f0f2f5] text-gray-400 p-8 flex-col text-center">
        <h2 className="text-2xl font-light text-gray-600 mb-2">Evolution Web</h2>
        <p>Selecione um contato para começar.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#efe7de]">
      {/* Header */}
      <div className="h-16 bg-[#f0f2f5] border-b border-gray-200 px-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
             {contact.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">{contact.name}</h2>
            <p className="text-[11px] text-gray-500">{contact.number}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col relative"
        style={{ backgroundImage: 'url("https://w0.peakpx.com/wallpaper/580/650/wallpaper-whatsapp-background.jpg")' }}
      >
        {messages.map((msg, index) => (
            <div key={msg.id || index} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
               <div className={`px-3 py-2 rounded-lg max-w-[75%] shadow-sm ${msg.sender === 'me' ? 'bg-[#dcf8c6]' : 'bg-white'}`}>
                  <div className="whitespace-pre-wrap break-words text-sm text-gray-800">{msg.text}</div>
                  <div className="text-[10px] text-gray-500 text-right mt-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
               </div>
            </div>
        ))}
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-[#f0f2f5] flex items-center gap-2 shrink-0">
        <form onSubmit={handleSendMessage} className="flex-1 flex items-center gap-2">
          <input 
            className="flex-1 px-4 py-2.5 rounded-lg border-none focus:ring-0 outline-none shadow-sm text-sm"
            placeholder="Type a message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={!inputText.trim()}
            className="p-2.5 bg-[#00a884] text-white rounded-full hover:bg-[#008f72] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;