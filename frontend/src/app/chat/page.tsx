'use client';

import { useState, useEffect } from 'react';
import { useChat } from 'ai/react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { signIn, getSession } from 'next-auth/react';
import jwt from 'jsonwebtoken';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const ChatCard = () => {
  const [token, setToken] = useState<string | null>(null);
  const [articlesPages, setArticlesPages] = useState<any>(null);
  const selectedCity = "Porto"; // Replace with actual selected city

  useEffect(() => {
    const fetchToken = async () => {
      const session = await getSession();
      if (!session?.user?.access_token) {
        signIn(); // Re-authenticate
        return;
      }

      const token = session.user.access_token;
      try {
        const decoded: any = jwt.decode(token); // Decode without verification to get the expiration
        if (decoded?.exp && Date.now() >= decoded.exp * 1000) {
          signIn(); // Re-authenticate
          return;
        }
        setToken(token);
      } catch (error) {
        console.error('Failed to decode JWT:', error);
        signIn(); // Re-authenticate
      }
    };

    fetchToken();
  }, []);

  useEffect(() => {
    const fetchArticlesPages = async () => {
      const response = await fetch('/api/articles-pages');
      const data = await response.json();
      setArticlesPages(data);
      console.log(data);
    };

    fetchArticlesPages();
  }, []);

  const addLinksToMarkdown = (text: string) => {
    return text.replace(/(Artigo\s+\d+(?:\.\º)?)/g, (artigo) => {
      console.log(articlesPages)
      console.log(selectedCity)
      const municipality_pages = articlesPages[selectedCity]
      console.log(municipality_pages) 
      const page = municipality_pages[artigo];
      return `[${artigo}](#${page})`;
    });
  }

  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: 'http://127.0.0.1:8000/chat_streaming/',
    streamProtocol: 'text',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!token) return <div>Loading...</div>; // Loading state while waiting for the token

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className="flex-grow p-4 flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Fale com o PDM</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[50vh] mb-4 p-4 border rounded-md">
              {messages.map((m) => (
                <div key={m.id} className={`mb-4 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <span
                    className={`inline-block p-2 rounded-lg ${
                      m.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {addLinksToMarkdown(m.content)}
                    </ReactMarkdown>
                  </span>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
          <CardFooter>
            <form onSubmit={handleSubmit} className="flex w-full space-x-2">
              <Input
                className="flex-grow"
                value={input}
                onChange={handleInputChange}
                placeholder="Type your message..."
              />
              <Button type="submit">Send</Button>
            </form>
          </CardFooter>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ChatCard;
