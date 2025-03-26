const { Router } = require('express');
const messageRoutes = require('./messages');

const router = Router();

// Pasar `socket.io` a las rutas
router.use(
	'/messages',
	(req, res, next) => {
		req.app.get('socketio');
		next();
	},
	messageRoutes
);

module.exports = router;
