import { io } from 'socket.io-client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Paperclip, Smile } from 'lucide-react';
import 'emoji-picker-element';

const SOCKET_URL = 'http://localhost:3000';
const socket = io(SOCKET_URL, {
	transports: ['websocket', 'polling'],
	reconnection: true,
});

const groupMessagesByDate = (messages) => {
	return messages.reduce((acc, msg) => {
		const date = new Date(msg.timestamp).toLocaleDateString();
		if (!acc[date]) acc[date] = [];
		acc[date].push(msg);
		return acc;
	}, {});
};

function App() {
	const [message, setMessage] = useState('');
	const [messages, setMessages] = useState([]);
	const [file, setFile] = useState(null);
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);
	const messagesEndRef = useRef(null);
	const emojiPickerRef = useRef(null);
	const inputRef = useRef(null);

	useEffect(() => {
		const fetchMessages = async () => {
			try {
				const response = await fetch(`${SOCKET_URL}/messages`);
				if (!response.ok) throw new Error('Error al obtener mensajes');
				setMessages(await response.json());
			} catch (error) {
				console.error(error.message);
			}
		};
		fetchMessages();

		const handleMessage = (msg) => {
			setMessages((prev) => [...prev, msg]);
			scrollToBottom();
		};
		socket.on('message', handleMessage);

		return () => {
			socket.off('message', handleMessage);
		};
	}, []);

	const scrollToBottom = useCallback(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, []);

	useEffect(() => {
		scrollToBottom();
	}, [messages, scrollToBottom]);

	// Configurar el evento emoji-click
	useEffect(() => {
		if (!emojiPickerRef.current) return;

		const handleEmojiSelect = (event) => {
			console.log('Emoji seleccionado:', event.detail.unicode); // Depuración
			setMessage((prev) => prev + event.detail.unicode);
			inputRef.current.focus();
		};

		emojiPickerRef.current.addEventListener('emoji-click', handleEmojiSelect);

		return () => {
			emojiPickerRef.current?.removeEventListener(
				'emoji-click',
				handleEmojiSelect
			);
		};
	}, []);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!message.trim() && !file) return;

		try {
			if (file) {
				const formData = new FormData();
				formData.append('file', file);
				formData.append('from', socket.id);

				const response = await fetch(`${SOCKET_URL}/upload`, {
					method: 'POST',
					body: formData,
				});

				const result = await response.json();
				if (!response.ok)
					throw new Error(result.error || 'Error al subir archivo');
				socket.emit('message', result);
				setFile(null);
			} else {
				socket.emit('message', {
					type: 'text',
					body: message.trim(),
					from: socket.id,
					timestamp: new Date().toISOString(),
				});
				setMessage('');
			}
		} catch (error) {
			console.error(error.message);
		}
	};

	return (
		<div className="h-screen flex items-center justify-center bg-gradient-to-r from-blue-200 to-purple-300">
			<div className="w-full max-w-lg backdrop-blur-lg bg-white/20 border border-white/30 shadow-xl rounded-2xl p-6 flex flex-col h-[80vh]">
				<h2 className="text-2xl font-bold text-center text-white mb-4 drop-shadow-lg">
					Chat VirtuAbogado
				</h2>
				<div className="flex-1 overflow-y-auto p-4 bg-white/30 backdrop-blur-lg rounded-xl shadow-inner">
					{Object.entries(groupMessagesByDate(messages)).map(([date, msgs]) => (
						<div key={date}>
							<div className="text-center my-2">
								<span className="bg-gray-500/80 text-white px-3 py-1 rounded-full text-sm shadow-md">
									{date}
								</span>
							</div>
							{msgs.map((msg, index) => (
								<div
									key={index}
									className={`flex ${
										msg.from === socket.id ? 'justify-end' : 'justify-start'
									} mb-3`}>
									<div
										className={`px-4 py-2 rounded-lg shadow-md text-white max-w-xs ${
											msg.from === socket.id
												? 'bg-blue-500/80'
												: 'bg-gray-500/80'
										}`}>
										<span className="text-sm font-semibold block">
											{msg.from === socket.id ? 'Yo' : 'Usuario'}
										</span>
										<p className="text-md">{msg.body}</p>
									</div>
								</div>
							))}
						</div>
					))}
					<div ref={messagesEndRef} />
				</div>

				{/* Picker de emojis */}
				<div
					className={`absolute bottom-20 left-4 bg-white p-2 rounded-lg shadow-lg ${
						showEmojiPicker ? 'block' : 'hidden'
					}`}>
					<emoji-picker ref={emojiPickerRef}></emoji-picker>
				</div>

				<form
					onSubmit={handleSubmit}
					className="mt-4 flex items-center gap-2 relative">
					<button
						type="button"
						onClick={() => setShowEmojiPicker(!showEmojiPicker)}
						className="bg-blue-500/80 text-white p-3 rounded-lg hover:bg-blue-600 transition cursor-pointer flex items-center gap-2">
						<Smile size={20} />
					</button>

					<label
						htmlFor="fileInput"
						className="bg-blue-500/80 text-white p-3 rounded-lg hover:bg-blue-600 transition cursor-pointer flex items-center gap-2">
						<Paperclip size={20} />
					</label>
					<input
						type="file"
						id="fileInput"
						className="hidden"
						onChange={(e) => setFile(e.target.files[0])}
					/>

					<input
						type="text"
						ref={inputRef}
						className="flex-1 p-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/30 placeholder-gray-500 text-gray-700"
						placeholder="Escribe tu mensaje..."
						value={message}
						onChange={(e) => setMessage(e.target.value)}
					/>

					<button
						type="submit"
						className="bg-blue-500/80 text-white px-6 py-3 text-lg rounded-lg hover:bg-blue-600 transition">
						Enviar
					</button>
				</form>
			</div>
		</div>
	);
}

export default App;
