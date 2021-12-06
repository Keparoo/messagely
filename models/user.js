/** User class for message.ly */

const { BCRYPT_WORK_FACTOR } = require('../config');
const ExpressError = require('../expressError');

/** User of the site. */

class User {
	/** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

	static async register({ username, password, first_name, last_name, phone }) {
		if (!username || !password || !first_name || !last_name || !phone) {
			throw new ExpressError(
				'username, password, first name, last name and phone are all required!',
				400
			);
		}
		try {
			const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
			// current_timestamp returns date & time with timezone. local_timestamp returns date & time without timezone
			const result = await db.query(
				`INSERT INTO users (
                    username,
                    password,
                    first_name,
                    last_name,
                    phone,
                    join_at,
                    last_login_at)
                VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
                RETURNING username, password, first_name, last_name, phone`,
				[ username, hashedPassword, first_name, last_name, phone ]
			);

			return result.rows[0];
		} catch (err) {
			return next(err);
		}
	}

	/** Authenticate: is this username/password valid? Returns boolean. */

	static async authenticate(username, password) {
		try {
			const result = await db.query(
				`SELECT password
                FROM users
                WHERE username = $1`,
				[ username ]
			);
			const user = result.rows[0];

			if (user) {
				return (await bcrypt.compare(password, user.password)) === true;
			}
			return false;
		} catch (err) {
			return next(err);
		}
	}

	/** Update last_login_at for user */

	static async updateLoginTimestamp(username) {
		try {
			const result = await db.query(
				`UPDATE users
                SET last_login_at current_timestamp
                WHERE username = $1
                RETURNING username`,
				[ username ]
			);
		} catch (err) {
			return next(err);
		}
	}

	/** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

	static async all() {}

	/** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

	static async get(username) {}

	/** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

	static async messagesFrom(username) {}

	/** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

	static async messagesTo(username) {}
}

module.exports = User;
