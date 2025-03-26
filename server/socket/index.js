const { Server } = require('socket.io');
const Message = require('../models/Message');

const setupSocket = (server) => {
	const io = new Server(server, {
		cors: {
			origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
			methods: ['GET', 'POST'],
		},
	});

	io.on('connection', (socket) => {
		console.log(`Cliente conectado: ${socket.id}`);

		socket.on('message', async (data) => {
			try {
				const message = new Message({
					type: 'text',
					body: data.body,
					from: data.from,
				});

				await message.save();
				io.emit('message', message);
			} catch (error) {
				console.error('Error al guardar el mensaje:', error);
			}
		});

		socket.on('disconnect', () => {
			console.log(`Cliente desconectado: ${socket.id}`);
		});
	});
};

module.exports = { setupSocket };
