import React, {useState, useRef, useEffect, useCallback } from 'react';
import { UserButton, useUser } from "@clerk/clerk-react";
import ReactMarkdown from "react-markdown";
import { Bot, Search } from "lucide-react";
import { toast } from 'react-toastify';

export default function Celeste(){
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef();
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [sessionId, setSessionId] = useState(() => localStorage.getItem("celeste_session") || null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const inactivityTimeoutRef = useRef(null);
  const warningTimeout = 1 * 60 * 1000; // 1 minuto
  const {user} = useUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress;

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }

    inactivityTimeoutRef.current = setTimeout(() => {
      setSessionExpired(true);
    }, warningTimeout);
  }, [warningTimeout]);



  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (input.trim()) {
      const userMessage = { id: Date.now(), role: "user", content: input };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);

      try {
        const response = await fetch(
          "https://celeste-back.vercel.app/celeste/chatbot",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              pregunta: input,
              sessionId: sessionId,
              userEmail,
              userName: `${user.firstName}`
            }),
          }
        );

        const data = await response.json();

        if (!sessionId) {
          setSessionId(data.sessionId);
          localStorage.setItem("celeste_session", data.sessionId);
        }

        if (data.expired) {
          setSessionExpired(true);
        }

        const botMessage = {
          id: Date.now() + 1,
          role: "assistant",
          content: data.respuesta || "Sin respuesta del servidor.",
        };
        setMessages((prev) => [...prev, botMessage]);
      } catch {
        const errorMessage = {
          id: Date.now() + 1,
          role: "assistant",
          content: "Error en la respuesta del servidor.",
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const email = async () => {
    setIsSendingEmail(true);
    try {
      await fetch("https://celeste-back.vercel.app/celeste/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          userEmail
        })
      });

      toast.success('¡Historial enviado al correo!');
      
      // Limpiar la sesión
      setSessionId(null);
      localStorage.removeItem("celeste_session");
      setMessages([]);
      setSessionExpired(false);
    } catch (error) {
      toast.error('Error al enviar el historial al correo: ' + error.message);
    } finally {
      setIsSendingEmail(false);
    }
};


  useEffect(() => {
  const handleActivity = () => {
    if (!sessionExpired) resetInactivityTimer();
  };

  window.addEventListener("keydown", handleActivity);
  resetInactivityTimer(); // iniciar por primera vez

  return () => {
    window.removeEventListener("keydown", handleActivity);
    clearTimeout(inactivityTimeoutRef.current);
  };
}, [sessionExpired, resetInactivityTimer]);


useEffect(() => {
  if (!user) return;

  const userEmail = user?.primaryEmailAddress?.emailAddress;

  const fetchPreviousSession = async () => {
    try {
      const response = await fetch("https://celeste-back.vercel.app/celeste/obtenerChat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail })
      });

      const data = await response.json();

      if (data?.sessionId && data?.messages) {
        const messagesWithId = data.messages.map((m, i) => ({
          ...m,
          id: `${data.sessionId}-${i}` // crear un id único combinando sessionId e índice
        }));
        setSessionId(data.sessionId);
        localStorage.setItem("celeste_session", data.sessionId);
        setMessages(messagesWithId);
      } else {
        console.log("No hay sesión previa registrada.");
      }
    } catch (error) {
      console.error("Error cargando sesión previa:", error);
    }
  };

  fetchPreviousSession();
}, [user]);




    return(
      <>
      {isSendingEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg px-6 py-4 shadow-lg text-center flex flex-col items-center">
            <svg
              className="animate-spin h-8 w-8 text-teal-500 mb-3"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              ></path>
            </svg>
            <p className="text-sm text-slate-700">Enviando historial al correo...</p>
          </div>
        </div>
      )}
        <main className="flex h-screen w-full flex-col bg-slate-100">
          <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-500 text-white">
                <Bot size={24} />
              </div>
              <div>
                <h1 className="font-bold text-slate-800">Celeste</h1>
                <p className="text-xs text-teal-500">● Online</p>
              </div>
            </div>
            <div className='flex items-center gap-3 text-gray-900'>
              {user.firstName} {user.lastName}
              <UserButton/>
            </div>
          </header>

        <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6" ref={scrollAreaRef}>
          <div className="messages text-gray-900 flex flex-col gap-4">
            {messages.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-full text-center text-gray-500">
                <div className="icon-container mb-4">
                  <Search className="w-10 h-10 text-teal-500" />
                </div>
                <h3 className="text-xl font-semibold">¿Cómo puedo ayudarte?</h3>
                <p className="text-sm">Pregúntame sobre tus hábitos alimenticios para obtener información.</p>
              </div>
            ) : (
              messages.map((message) => {
                const isUser = message.role === "user";
                return (
                  <div
                    key={message.id}
                    className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white font-bold 
                        ${isUser ? "bg-slate-400 order-2" : "bg-teal-500"}`}>
                        {isUser ? <img src={user.imageUrl} className='rounded-full' /> : <Bot size={20} />}
                    </div>

                    <div
                      className={`max-w-sm rounded-2xl px-4 py-2.5 md:max-w-md lg:max-w-lg ${
                        isUser
                          ? "rounded-br-none bg-blue-600 text-white"
                          : "rounded-bl-none bg-slate-200 text-slate-800"
                      }`}
                    >
                      <div className="text-sm leading-relaxed">
                        {isUser ? (
                          <p>{message.content}</p>
                        ) : (
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {isLoading && (
              <div className="flex items-end gap-2 justify-start">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-500 text-white">
                  <Search size={20} />
                </div>
                <div className="max-w-sm rounded-2xl rounded-bl-none bg-slate-200 px-4 py-2.5 text-slate-800 md:max-w-md lg:max-w-lg">
                  <div className="text-sm leading-relaxed flex gap-1">
                    <span className="dot w-2 h-2 bg-slate-500 rounded-full animate-bounce"></span>
                    <span className="dot w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-200"></span>
                    <span className="dot w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-400"></span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="border-t border-slate-200 bg-white p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="relative">
            {sessionExpired && (
              <div className="text-center text-sm text-slate-600 my-4">
                <p>Veo que ha pasado un rato sin actividad. ¿Deseas continuar?</p>
                <div className="flex justify-center gap-2 mt-2">
                  <button
                    onClick={() => {
                      setSessionExpired(false);
                      resetInactivityTimer(); // reinicia el contador
                    }}
                    className="px-4 py-2 bg-teal-500 text-white rounded-full cursor-pointer"
                  >
                    Sí, continuar
                  </button>
                  <button
                    type="button"
                    onClick={email}
                    className="px-4 py-2 bg-slate-300 text-slate-800 rounded-full cursor-pointer"
                  >
                    Empezar nueva sesión
                  </button>
                </div>
              </div>
            )}


            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Pregunta algo sobre tu alimentación"
              className="w-full rounded-full border border-slate-300 bg-slate-50 py-3 pl-4 pr-14 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              disabled={isLoading || sessionExpired}
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-teal-500 text-white transition-colors hover:bg-teal-600 disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={isLoading || sessionExpired || !input.trim()}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="send-icon"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </button>
          </form>
        </footer>

      </main>
      </>
    )
}