const express = require('express');
const router = new express.Router();

const Message = require('../models/message');
const { ensureLoggedIn, ensureCorrectUser } = require('../middleware/auth');
const User = require('../models/user');

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get('/:id', ensureLoggedIn, async function(req, res, next) {
	try {
		const username = req.user.username;
		const message = await Message.get(req.params.id);
		if (
			username === message.from_user.username ||
			username === message.to_user.username
		) {
			return res.json({ message });
		}
		throw new ExpressError(`Not allowed to read this message`, 401);
	} catch (err) {
		return next(err);
	}
});

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post('/', ensureLoggedIn, async function(req, res, next) {
	try {
		const message = await Message.create({
			from_username: req.user.username,
			to_username: req.body.to_username,
			body: req.body.body
		});
		return res.json({ message });
	} catch (err) {
		return next(err);
	}
});

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post('/:id/read', ensureLoggedIn, async function(req, res, next) {
	try {
		const id = req.params.id;
		const message = await Message(id);

		if (message.to_user.username !== req.user.username) {
			throw new ExpressError('Not authorized to set this message to read', 401);
		}
		const result = await Message.markRead(id);
		return req.json({ message: result });
	} catch (err) {
		return next(err);
	}
});

module.exports = router;
