import { io } from 'socket.io-client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Paperclip } from 'lucide-react';

const SOCKET_URL = 'http://localhost:3000';
const socket = io(SOCKET_URL, {
	transports: ['websocket', 'polling'],
	reconnection: true,
});

function App() {
	const [message, setMessage] = useState('');
	const [messages, setMessages] = useState([]);
	const [file, setFile] = useState(null);
	const messagesEndRef = useRef(null);

	useEffect(() => {
		const fetchMessages = async () => {
			try {
				const response = await fetch(`${SOCKET_URL}/messages`);
				if (!response.ok) throw new Error('Error al obtener mensajes');
				const data = await response.json();
				setMessages(data);
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
				if (response.ok) {
					socket.emit('message', result);
				} else {
					throw new Error(result.error || 'Error al subir archivo');
				}

				setFile(null);
			} else {
				const msg = {
					type: 'text',
					body: message,
					from: socket.id,
					timestamp: new Date().toISOString(),
				};
				socket.emit('message', msg);
				setMessage('');
			}
		} catch (error) {
			console.error(error.message);
		}
	};

	// Función para agrupar mensajes por fecha
	const groupMessagesByDate = (messages) => {
		const grouped = {};
		messages.forEach((msg) => {
			const date = new Date(msg.timestamp).toLocaleDateString();
			if (!grouped[date]) {
				grouped[date] = [];
			}
			grouped[date].push(msg);
		});
		return grouped;
	};

	const groupedMessages = groupMessagesByDate(messages);

	return (
		<div className="h-screen flex items-center justify-center bg-gradient-to-r from-rose-50 to-pink-100">
			<div className="w-full max-w-lg bg-white shadow-lg rounded-2xl p-6 flex flex-col h-[80vh]">
				<h2 className="text-2xl font-bold text-center text-gray-700 mb-4">
					Chat VirtuAbogado
				</h2>
				<div className="flex-1 overflow-y-auto px-3 py-2 bg-gray-100 rounded-lg">
					{Object.keys(groupedMessages).map((date) => (
						<div
							key={date}
							className="mb-6">
							{/* 📌 NUEVO: Fecha con mejor visibilidad y color actualizado */}
							<div className="flex justify-center">
								<div className="bg-[#444AB2] text-white text-sm px-4 py-1 rounded-full shadow-md">
									{date}
								</div>
							</div>

							<div className="mt-2">
								{groupedMessages[date].map((msg, index) => (
									<div
										key={index}
										className={`flex ${
											msg.from === socket.id ? 'justify-end' : 'justify-start'
										} mb-3`}>
										<div
											className={`px-4 py-2 rounded-lg text-white shadow-md max-w-xs ${
												msg.from === socket.id ? 'bg-blue-500' : 'bg-gray-500'
											}`}>
											<span className="text-sm font-semibold block">
												{msg.from === socket.id ? 'Yo' : 'Usuario'}
											</span>
											{msg.type === 'text' ? (
												<p className="text-md">{msg.body}</p>
											) : (
												<div>
													<p className="font-bold">{msg.fileName}</p>
													{msg.fileUrl?.startsWith('data:image') ? (
														<img
															src={msg.fileUrl}
															alt="Adjunto"
															className="w-40 rounded-md mt-2"
														/>
													) : (
														<a
															href={msg.fileUrl}
															download={msg.fileName}
															className="text-yellow-200 underline">
															📄 Descargar archivo
														</a>
													)}
												</div>
											)}
										</div>
									</div>
								))}
							</div>
						</div>
					))}
					<div ref={messagesEndRef} />
				</div>
				<form
					onSubmit={handleSubmit}
					className="mt-4 flex items-center gap-2">
					<label
						htmlFor="fileInput"
						className="bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition cursor-pointer flex items-center gap-2">
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
						className="flex-1 p-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="Escribe tu mensaje..."
						value={message}
						onChange={(e) => setMessage(e.target.value)}
					/>
					<button
						type="submit"
						className="bg-blue-500 text-white px-6 py-3 text-lg rounded-lg hover:bg-blue-600 transition">
						Enviar
					</button>
				</form>
			</div>
		</div>
	);
}

export default App;
