import React, { useState, useEffect, useRef } from "react";
import "./Chatbot.css";

function ChatBot({ onClose }) {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [location, setLocation] = useState(null);
  const [locationFetched, setLocationFetched] = useState(false);
  const chatEndRef = useRef(null);

  // Example quick options
  const quickOptions = [
    "Book Turf",
    "Cancel",
    "Login",
    "Sign Up",
    "Best turf near me",
    "Cheap turf under 1000"
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

  function getCurrentLocation() {
    if (locationFetched) {
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
      const userLocation = await getCurrentLocation();
      const payload = {
        message: textToSend,
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
      const reply = data.reply || "Sorry, no response from server.";

      // Replace the temporary "..." with actual server reply
      updateLastBotMessage(reply);
    } catch (error) {
      updateLastBotMessage("Error connecting to server.");
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
        <span className="close-btn" onClick={handleCloseClick} style={{cursor: 'pointer'}}>X</span>
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
          placeholder="Ask something..."
        />
        <button onClick={handleSendButtonClick}>Send</button>
      </div>
    </div>
  );
}

export default ChatBot;

