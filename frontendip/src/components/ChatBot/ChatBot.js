import React, { useState, useEffect, useRef } from "react";
import "./Chatbot.css";

function ChatBot({ onClose }) {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [location, setLocation] = useState(null);
  const [locationFetched, setLocationFetched] = useState(false);
  const [sessionId] = useState(function () {
    return "chat-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  });
  const chatEndRef = useRef(null);

  // Example quick options
  const quickOptions = [
    "Book Turf",
    "Cancel",
    "Login",
    "Sign Up",
    "Best Turf Near Me",
    "Affordable Turfs Under 1000"
  ];

  // Scrolls to the bottom of the chat automatically
  function scrollToBottom() {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }

  useEffect(function () {
    scrollToBottom();
  }, [chat]);

  useEffect(function () {
    getCurrentLocation();
  }, []);

  function isNearbyTurfQuery(text) {
    const q = String(text || "").toLowerCase();
    return /(near me|nearby|nearest|around me|closest|best turf|best turfs|cheap turf|affordable turf|turf under|turf below|turf within)/.test(q);
  }

  function getCurrentLocation(forceRefresh) {
    if (locationFetched && !forceRefresh) {
      return Promise.resolve(location);
    }

    return new Promise(function (resolve) {
      if (!navigator.geolocation) {
        setLocationFetched(true);
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        function (position) {
          const userLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setLocation(userLocation);
          setLocationFetched(true);
          resolve(userLocation);
        },
        function () {
          // Permission denied or unavailable; continue chat without location.
          setLocationFetched(true);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 6000,
        }
      );
    });
  }

  function updateLastBotMessage(newText) {
    setChat(function (prev) {
      const newChat = [...prev];
      if (newChat.length > 0) {
        newChat[newChat.length - 1].bot = newText;
      }
      return newChat;
    });
  }

  async function sendMessage(msgText) {
    let textToSend = message;
    if (typeof msgText === "string") {
      textToSend = msgText;
    }

    if (!textToSend.trim()) {
      return;
    }

    // Optimistically add user message and temporary bot "..." message
    setChat(function (prev) {
      return [...prev, { user: textToSend, bot: "..." }];
    });
    setMessage(""); // Clear input

    try {
      const shouldForceLocationFetch = isNearbyTurfQuery(textToSend) && !location;
      const userLocation = await getCurrentLocation(shouldForceLocationFetch);
      const payload = {
        message: textToSend,
        sessionId: sessionId,
        userRole: localStorage.getItem('userRole') || 'guest',
        userName: localStorage.getItem('userName') || localStorage.getItem('userEmail') || 'friend'
      };

      if (userLocation && userLocation.latitude != null && userLocation.longitude != null) {
        payload.latitude = userLocation.latitude;
        payload.longitude = userLocation.longitude;
      }

      const res = await fetch("http://localhost:8080/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      const reply = data.reply || "Sorry, I could not get a response right now.";

      // Replace the temporary "..." with actual server reply
      updateLastBotMessage(reply);
    } catch (_error) {
      updateLastBotMessage("I am having trouble connecting right now. Please try again in a moment.");
    }
  }

  // Handler for quick options to send instantly
  function handleQuickOption(option) {
    sendMessage(option);
  }

  function handleCloseClick() {
    onClose();
  }

  function handleInputChange(event) {
    setMessage(event.target.value);
  }

  function handleInputKeyDown(event) {
    if (event.key === "Enter") {
      sendMessage(message);
    }
  }

  function handleSendButtonClick() {
    sendMessage(message);
  }

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        Turf Explorer Assistant
        <span className="close-btn" onClick={handleCloseClick}>X</span>
      </div>

      <div className="chatbot-messages">
        {chat.length === 0 && (
          <div className="chatbot-bot">
            <span>Hello! How can I help you today?</span>
          </div>
        )}
        {chat.map((c, i) => (
          <div key={i}>
            <div className="chatbot-user">
              <span>{c.user}</span>
            </div>
            <div className="chatbot-bot">
              <span>{c.bot}</span>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="chatbot-quick-options">
        {quickOptions.map((opt, idx) => (
          <button key={idx} onClick={function() { handleQuickOption(opt); }}>
            {opt}
          </button>
        ))}
      </div>

      <div className="chatbot-input-area">
        <input
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          placeholder="Ask a question"
        />
        <button onClick={handleSendButtonClick}>Send</button>
      </div>
    </div>
  );
}

export default ChatBot;

