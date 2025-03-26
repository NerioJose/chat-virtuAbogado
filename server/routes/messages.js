const express = require('express');
const Message = require('../models/Message');
const { upload } = require('../config/cloudinary');

const router = express.Router();

// Obtener historial de mensajes
router.get('/', async (req, res) => {
	try {
		const messages = await Message.find().sort({ timestamp: 1 });
		res.json(messages);
	} catch (error) {
		console.error('Error al obtener mensajes:', error);
		res.status(500).json({ error: 'Error al obtener mensajes' });
	}
});

// Enviar mensaje de texto
router.post('/', async (req, res) => {
	try {
		let { body, from } = req.body;

		// Validaciones
		if (!body || !from) {
			return res.status(400).json({ error: 'Faltan datos' });
		}

		// Evitar mensajes vacíos o solo con espacios
		body = body.trim();
		if (body.length === 0) {
			return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
		}

		const message = new Message({ type: 'text', body, from });
		await message.save();

		// Emitir mensaje a los clientes conectados
		const io = req.app.get('socketio');
		if (io) io.emit('message', message);

		res.status(201).json(message);
	} catch (error) {
		console.error('Error al enviar mensaje:', error);
		res.status(500).json({ error: 'Error al enviar mensaje' });
	}
});

// Subir archivo y enviar mensaje
router.post('/upload', upload.single('file'), async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({ error: 'No se envió ningún archivo' });
		}

		const { originalname } = req.file;
		const fileUrl = req.file.path;
		const { from } = req.body;

		// Validar que `from` no esté vacío
		if (!from) {
			return res.status(400).json({ error: 'Faltan datos' });
		}

		const message = new Message({
			type: 'file',
			fileUrl,
			fileName: originalname,
			from,
		});
		await message.save();

		// Emitir mensaje a los clientes conectados
		const io = req.app.get('socketio');
		if (io) io.emit('message', message);

		res.status(201).json(message);
	} catch (error) {
		console.error('Error al subir archivo:', error);
		res.status(500).json({ error: 'Error al subir archivo' });
	}
});

module.exports = router;
