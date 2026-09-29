import { useEffect, useRef, useState } from "react";
import {
  Bot,
  ChevronDown,
  LoaderCircle,
  MessageCircle,
  Send,
  Sparkles,
  X,
} from "lucide-react";

import { apiFetch, getCsrfCookie } from "../api";
import "../styles/rag-chat.css";

const WELCOME_MESSAGE = {
  role: "assistant",
  content:
    "Hi! I can answer questions from the RideRent document. What would you like to know?",
  sources: [],
};

function RagChatWidget() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [messages, loading]);

  useEffect(() => {
    if (open) {
      window.setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const submitQuestion = async (event) => {
    event?.preventDefault();

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || loading) {
      return;
    }

    const userMessage = {
      role: "user",
      content: trimmedQuestion,
    };

    const history = messages
      .filter(
        (message) => message.role === "user" || message.role === "assistant",
      )
      .slice(-8)
      .map((message) => ({
        role: message.role,
        content: message.content,
      }));

    setMessages((previous) => [...previous, userMessage]);
    setQuestion("");
    setLoading(true);

    try {
      // Laravel Sanctum protects POST requests with CSRF.
      await getCsrfCookie();

      const response = await apiFetch("/api/agent/chat", {
        method: "POST",
        body: JSON.stringify({
          question: trimmedQuestion,
          history,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "The assistant could not answer right now.",
        );
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: data.answer,
          //sources: data.sources || [],
        },
      ]);
    } catch (error) {
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content:
            error.message ||
            "Something went wrong while contacting the assistant.",
          sources: [],
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitQuestion();
    }
  };

  return (
    <>
      {open && (
        <section
          className="rag-chat-panel"
          aria-label="RideRent AI document assistant"
        >
          <header className="rag-chat-header">
            <div className="rag-chat-title">
              <div className="rag-chat-avatar">
                <Bot size={20} />
              </div>

              <div>
                <strong>RideRent Assistant</strong>
                <span>
                  <span className="rag-online-dot" />
                  PDF-powered assistant
                </span>
              </div>
            </div>

            <button
              type="button"
              className="rag-header-button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
            >
              <X size={19} />
            </button>
          </header>

          <div className="rag-chat-body">
            <div className="rag-welcome">
              <Sparkles size={16} />
              <span>Ask about the information in our document.</span>
            </div>

            <div className="rag-messages">
              {messages.map((message, index) => (
                <div
                  className={`rag-message-row ${message.role}`}
                  key={`${message.role}-${index}`}
                >
                  {message.role === "assistant" && (
                    <div className="rag-mini-avatar">
                      <Bot size={14} />
                    </div>
                  )}

                  <div
                    className={`rag-message ${
                      message.error ? "rag-message-error" : ""
                    }`}
                  >
                    <div className="rag-message-text">{message.content}</div>

                    {message.sources?.length > 0 && (
                      <div className="rag-sources">
                        <span>Sources</span>

                        {message.sources.map((source, sourceIndex) => (
                          <span
                            className="rag-source"
                            key={`${source.filename}-${source.page}-${sourceIndex}`}
                          >
                            {source.filename} · p. {source.page}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="rag-message-row assistant">
                  <div className="rag-mini-avatar">
                    <Bot size={14} />
                  </div>

                  <div className="rag-message rag-typing">
                    <LoaderCircle size={16} className="rag-spinner" />
                    <span>Searching the document...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          <form className="rag-chat-input-area" onSubmit={submitQuestion}>
            <textarea
              ref={inputRef}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask something about the PDF..."
              rows={1}
              maxLength={4000}
              disabled={loading}
              aria-label="Ask the RideRent assistant"
            />

            <button
              type="submit"
              className="rag-send-button"
              disabled={!question.trim() || loading}
              aria-label="Send question"
            >
              {loading ? (
                <LoaderCircle size={18} className="rag-spinner" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </form>

          <div className="rag-chat-footer">
            Answers are generated from the configured RideRent PDF.
          </div>
        </section>
      )}

      <button
        type="button"
        className={`rag-floating-button ${open ? "is-open" : ""}`}
        onClick={() => setOpen((previous) => !previous)}
        aria-label={
          open ? "Close RideRent assistant" : "Open RideRent assistant"
        }
        aria-expanded={open}
      >
        {open ? <ChevronDown size={25} /> : <MessageCircle size={25} />}

        {!open && <span className="rag-floating-label">Ask AI</span>}
      </button>
    </>
  );
}

export default RagChatWidget;
