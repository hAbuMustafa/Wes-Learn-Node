const express = require('express');
const router = express.Router();

// Do work here
router.get('/', (req, res) => {
  // res.send('Hey! It works!');
  // const hos = { name: 'Hosam', Age: '31' };
  // res.json(hos);
  res.render('hello', { name: req.query.name });
});

// router.get('/reverse/:name', (req, res) => {
//   const reverse = [...req.params.name].reverse().join('');
//   res.send(reverse);
// });

module.exports = router;
