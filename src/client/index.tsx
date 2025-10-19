import { createRoot } from "react-dom/client";
import { usePartySocket } from "partysocket/react";
import React, { useState, useEffect, useRef } from "react";
import {
	BrowserRouter,
	Routes,
	Route,
	Navigate,
	useParams,
} from "react-router";
import { nanoid } from "nanoid";

import { names, type ChatMessage, type Message } from "../shared";

function App() {
	// Get or create username from localStorage
	const getStoredUsername = () => {
		const stored = localStorage.getItem('chat-username');
		if (stored && names.includes(stored)) {
			return stored;
		}
		// Generate new username and store it
		const newUsername = names[Math.floor(Math.random() * names.length)];
		localStorage.setItem('chat-username', newUsername);
		return newUsername;
	};

	const [name] = useState(getStoredUsername());
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const { room } = useParams();
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const messagesContainerRef = useRef<HTMLDivElement>(null);
	const [showScrollButton, setShowScrollButton] = useState(false);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	// Handle scroll to show/hide scroll button
	useEffect(() => {
		const container = messagesContainerRef.current;
		if (!container) return;

		const handleScroll = () => {
			const { scrollTop, scrollHeight, clientHeight } = container;
			const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100; // 100px threshold
			setShowScrollButton(!isNearBottom);
		};

		container.addEventListener('scroll', handleScroll);
		handleScroll(); // Check initial state

		return () => container.removeEventListener('scroll', handleScroll);
	}, []);

	// Generate consistent color for username
	const getUserColor = (username: string) => {
		// Predefined color palette with good contrast for both light and dark modes
		const colorPalette = [
			'#e74c3c', // Red
			'#3498db', // Blue
			'#2ecc71', // Green
			'#f39c12', // Orange
			'#9b59b6', // Purple
			'#1abc9c', // Teal
			'#e67e22', // Carrot
			'#34495e', // Dark Blue Gray
			'#16a085', // Dark Teal
			'#27ae60', // Dark Green
			'#2980b9', // Dark Blue
			'#8e44ad', // Dark Purple
			'#d35400', // Dark Orange
			'#c0392b', // Dark Red
			'#7f8c8d', // Gray
			'#f1c40f', // Yellow (but not too bright)
			'#e84393', // Pink
			'#00b894', // Mint
			'#fd79a8', // Light Pink
			'#fdcb6e', // Cream
		];
		
		// Simple hash to get consistent index
		let hash = 0;
		for (let i = 0; i < username.length; i++) {
			hash = username.charCodeAt(i) + ((hash << 5) - hash);
		}
		
		// Use absolute value and modulo to get palette index
		const index = Math.abs(hash) % colorPalette.length;
		return colorPalette[index];
	};

	const socket = usePartySocket({
		party: "chat",
		room,
		onMessage: (evt) => {
			const message = JSON.parse(evt.data as string) as Message;
			if (message.type === "add") {
				const foundIndex = messages.findIndex((m) => m.id === message.id);
				if (foundIndex === -1) {
					// probably someone else who added a message
					setMessages((messages) => [
						...messages,
						{
							id: message.id,
							content: message.content,
							user: message.user,
							role: message.role,
							timestamp: message.timestamp,
						},
					]);
				} else {
					// this usually means we ourselves added a message
					// and it was broadcasted back
					// so let's replace the message with the new message
					setMessages((messages) => {
						return messages
							.slice(0, foundIndex)
							.concat({
								id: message.id,
								content: message.content,
								user: message.user,
								role: message.role,
								timestamp: message.timestamp,
							})
							.concat(messages.slice(foundIndex + 1));
					});
				}
			} else if (message.type === "update") {
				setMessages((messages) =>
					messages.map((m) =>
						m.id === message.id
							? {
								id: message.id,
								content: message.content,
								user: message.user,
								role: message.role,
								timestamp: message.timestamp,
							}
							: m,
					),
				);
			} else {
				setMessages(message.messages);
			}
		},
	});

	return (
		<div className="chat-app">
			<div className="messages-container" ref={messagesContainerRef}>
				<div className="messages-list">
					{messages.map((message) => (
						<div key={message.id} className="message">
							<div className="message-header">
								<span 
									className="message-user" 
									style={{ color: getUserColor(message.user) }}
								>
									{message.user}
								</span>
								<span className="message-time">
									{new Date(message.timestamp).toLocaleString()}
								</span>
							</div>
							<div className="message-content">{message.content}</div>
						</div>
					))}
					<div ref={messagesEndRef} />
				</div>
			</div>

			{showScrollButton && (
				<button 
					className="scroll-to-bottom-btn"
					onClick={scrollToBottom}
					aria-label="Scroll to new messages"
				>
					New message
				</button>
			)}

			<div className="message-form-container">
				<form
					className="message-form"
					onSubmit={(e) => {
						e.preventDefault();
						const content = e.currentTarget.elements.namedItem(
							"content",
						) as HTMLInputElement;
						const chatMessage: ChatMessage = {
							id: nanoid(8),
							content: content.value,
							user: name,
							role: "user",
							timestamp: Date.now(),
						};
						setMessages((messages) => [...messages, chatMessage]);
						// we could broadcast the message here

						socket.send(
							JSON.stringify({
								type: "add",
								...chatMessage,
							} satisfies Message),
						);

						content.value = "";
					}}
				>
					<input
						type="text"
						name="content"
						className="message-input"
						placeholder={`Hello ${name}! Type a message...`}
						autoComplete="off"
					/>
					<button type="submit" className="send-button">
						Send
					</button>
				</form>
				<div className="credit">@minhqnd</div>
			</div>
		</div>
	);
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById("root")!).render(
	<BrowserRouter>
		<Routes>
			<Route path="/" element={<Navigate to={`/${nanoid()}`} />} />
			<Route path="/:room" element={<App />} />
			<Route path="*" element={<Navigate to="/" />} />
		</Routes>
	</BrowserRouter>,
);
