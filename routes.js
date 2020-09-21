const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const moment = require('moment');
require('./model');
const User = mongoose.model('User');
const Exercise = mongoose.model('Exercise');

/**
 * I can create a user by posting form data username to 
 * /exercise/new-user
 *  and returned will be an object with username and _id.
 */
router.post('/exercise/new-user', (req, res) => {
    const { username } = req.body;
    User.findOne({username}, (err, user) => {
			if (user) throw new Error('username already taken');
			return User.create({ username }, (err, user) => {
				if(err) {
					console.log(err);
					res.status(500).send(err.message);
				}
				res.status(200).send({
					username: user.username,
					_id: user._id
			});
			})
		})
})

router.post('/exercise//add', (req, res, next) => {
	const { userId, description, duration, date } = req.body;

  const newExercise = new Exercise({
    userId, description, duration, date
  });

  newExercise.save()
  .then(() => res.json('Exercise added!'))
  .catch(err => res.status(400).json('Error: ' + err));
});

router.get('/exercise/log', (req, res, next) => {
	let { userId, from, to, limit } = req.query;
	from = moment(from, 'YYYY-MM-DD').isValid() ? moment(from, 'YYYY-MM-DD') : 0;
	to = moment(to, 'YYYY-MM-DD').isValid() ? moment(to, 'YYYY-MM-DD') : moment().add(1000000000000);
	User.findById(userId, (err, user) => {
		if (!user) throw new Error('Unknown user with _id');

		Exercise.find({ userId })
				.where('date').gte(from).lte(to)
				.limit(+limit)
				.exec((err, log)  => {
					if(err) res.status(500).send(err.message);
					res.status(200).send({
						_id: userId,
						username: user.username,
						count: log.length,
						log: log.map(o => ({
								description: o.description,
								duration: o.duration,
								date: moment(o).format('ddd MMMM DD YYYY')
						}))
				})
	})
}
)})

module.exports = router;