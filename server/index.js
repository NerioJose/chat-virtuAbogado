const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db'); // Importamos la conexión a MongoDB
const { setupSocket } = require('./socket'); // Importamos la configuración de WebSockets
const routes = require('./routes/messages'); // Importamos las rutas

// Cargar variables de entorno
dotenv.config();

// Validar variables de entorno
if (!process.env.MONGODB_URI) {
	throw new Error('⚠️ Faltan variables de entorno en .env');
}

// Conectar a MongoDB
connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/messages', routes); // Configurar rutas

const server = http.createServer(app);
setupSocket(server); // Configurar WebSockets

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`));

module.exports = app;
