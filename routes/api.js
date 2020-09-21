const Users = require('../models/users')
const Exercises = require('../models/exercises')

const router = require('express').Router()

router.post('/new-user', (req, res, next) => {
  const user = new Users(req.body);
  user.save((err, savedUser) => { 
    if (err) return next(err);
    res.json({
      username: savedUser.username,
      _id: savedUser._id
    })
  })
})

router.get('/users', (req,res,next) => {
  Users.find({}, (err, data) => {
    if (err) return next(err);
    res.json(data)
  })
})

router.post('/add', (req, res, next) => {
  Users.findById(req.body.userId, (err, user) => {
    if (err) return next(err);
    if (!user) {
      return next(err)
    }
    if (req.body.date == '') {
      let today = new Date().toISOString().slice(0, 10);
      req.body.date = today;
    }
    
    const exercise = new Exercises(req.body)
    exercise.username = user.username
    exercise.save((err, savedExercise) => {
      if (err) return next(err)
      res.json(savedExercise)
    })
      
  })
})

router.get('/log', (req, res, next) => {
  if (Object.keys(req.query).length == 0 || req.query.userId == '') {
    Exercises.find({}, (err, data) => {
      if (err) return next(err);
      res.json(data)
    })
  } else {
    console.log('from date: ' + req.query.from_date);
    console.log('to date: ' + req.query.to_date);
    const from = new Date(req.query.from_date)
    const to = new Date(req.query.to_date)
    console.log('from date: ' + from);
    console.log('to date: ' + to);
    console.log('non-empty /log request');
    let out = {};
    Users.findById(req.query.userId, (err, user) => {
      Exercises.find({
        userId: req.query.userId,
        date: {
          $lte: to != 'Invalid Date' ? to.getTime() : Date.now() ,
          $gte: from != 'Invalid Date' ? from.getTime() : 0
        }
      })
      .sort('-date')
      .limit(parseInt(req.query.limit))
      .exec((err, exercises) => {
        if (err) return next(err)
        if (exercises.length < 1) {
          return next({status:400, message: 'unknown userId'})
        } else {
          console.log('user(typeof):  ' + user + '(' + typeof(user) + ')');
          out = user.toJSON();
          delete out.__v;
          console.log('exercises.length:  ' + exercises.length);
          out['count'] = exercises.length;
          out['log'] = exercises.map(e => ({
            description: e.description,
            duration: e.duration,
            date: e.date.toDateString()
          }))
          console.log(out);
          res.json(out)
        }
      })
    })
  }
})

router.post('/delete-user', (req, res, next) => {
  Exercises.deleteMany({userId: req.body.userId}, function(err){});
  Users.findByIdAndRemove(req.body.userId, (err, user) => {
    if (err || !user) return next(err);
    res.send("Removed");
  })
})

module.exports = router