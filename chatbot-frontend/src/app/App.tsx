import React, { useState, useEffect, useRef } from 'react';
import './App.module.less';

function App() {
    const [userInput, setUserInput] = useState('');
    const [chatLog, setChatLog] = useState([]);
    const [loading, setLoading] = useState(false);
    const chatWindowRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        // Load chat history from localStorage
        try {
            const storedChatLog = localStorage.getItem('chatLog');
            if (storedChatLog) {
                setChatLog(JSON.parse(storedChatLog));
            }
        } catch (error) {
            console.error("Failed to load chat log from localStorage:", error);
        }

        // Focus input on initial load
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        // Scroll to bottom when chat updates
        if (chatWindowRef.current) {
            const { scrollHeight, clientHeight } = chatWindowRef.current;
            chatWindowRef.current.scrollTo({
                top: scrollHeight - clientHeight,
                behavior: 'smooth'
            });
        }

        // Save to localStorage when chat updates (if not empty)
        if (chatLog.length > 0) {
            try {
                localStorage.setItem('chatLog', JSON.stringify(chatLog));
            } catch (error) {
                console.error("Failed to save chat log to localStorage:", error);
            }
        }
    }, [chatLog]);


    const handleInputChange = (event) => {
        setUserInput(event.target.value);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const trimmedInput = userInput.trim();
        if (!trimmedInput || loading) return;

        // Add user message to chat
        const userMessage = { type: 'user', text: trimmedInput };
        setChatLog(prevChatLog => [...prevChatLog, userMessage]);

        setUserInput('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:8000/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_message: trimmedInput }),
            });

            if (!response.ok) {
                let errorDetail = `HTTP error! Status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorDetail = errorData.detail || errorDetail;
                } catch (parseError) {
                    errorDetail = `${errorDetail} ${response.statusText || ''}`.trim();
                }
                throw new Error(errorDetail);
            }

            const data = await response.json();
            const botResponseText = data.response;

            if (typeof botResponseText !== 'string' || !botResponseText) {
                throw new Error("Received invalid or empty response from bot.");
            }

            // Add bot message to chat
            setChatLog(prevChatLog => [
                ...prevChatLog,
                { type: 'bot', text: botResponseText }
            ]);

        } catch (error) {
            console.error('Error fetching chat response:', error);

            // Add error message to chat
            setChatLog(prevChatLog => [
                ...prevChatLog,
                {
                    type: 'error',
                    text: `Error: ${error.message || 'Could not connect to the bot. Please try again.'}`
                }
            ]);
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    };

    return (
        <div className="App">
            <h1 className="chat-title">~AI Chat Assistant</h1>

            <div className="chat-window" ref={chatWindowRef} aria-live="polite">
                {chatLog.map((message, index) => (
                    <div key={index} className={`message ${message.type}`}>
                        {message.text}
                    </div>
                ))}
                {loading && <div className="loading-indicator">Bot is thinking...</div>}
            </div>

            <form className="chat-form" onSubmit={handleSubmit}>
                <input
                    ref={inputRef}
                    type="text"
                    value={userInput}
                    onChange={handleInputChange}
                    placeholder="Type your message..."
                    disabled={loading}
                    aria-label="Chat message input"
                />
                <button type="submit" disabled={loading}>
                    Send
                </button>
            </form>
        </div>
    );
}

export default App;
