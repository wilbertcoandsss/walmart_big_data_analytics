import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://10.35.148.59:5001");

function KafkaListener() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    socket.on("all_messages", (data) => setMessages(data));
    socket.on("receive_message", (data) =>
      setMessages((prev) => [...prev, data])
    );
    socket.on("welcome", (data) => console.log("Server:", data));

    return () => {
      socket.off("all_messages");
      socket.off("receive_message");
      socket.off("welcome");
    };
  }, []);

  const sendMessage = async () => {
    if (!input) return;
    try {
      const res = await fetch("http://10.35.148.59:5001/send_to_kafka", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ msg: input }),
      });
      const data = await res.json();
      if (data.status === "ok") setInput(""); // reset input
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h3>📡 Kafka Real-time Messages with History</h3>

      <div style={{ marginBottom: "1rem" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send to Kafka</button>
      </div>

      <ul>
        {messages.map((msg, i) => (
          <li key={i}>{JSON.stringify(msg)}</li>
        ))}
      </ul>
    </div>
  );
}

export default KafkaListener;