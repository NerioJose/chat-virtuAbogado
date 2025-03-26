const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
	{
		type: String,
		body: String,
		from: String,
		timestamp: { type: Date, default: Date.now },
		fileUrl: String,
		fileName: String,
	},
	{ timestamps: true }
);

// Verifica si el modelo ya está registrado antes de crearlo
const Message =
	mongoose.models.Message || mongoose.model('Message', MessageSchema);

module.exports = Message;
