const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');

exports.loginForm = (req, res) => {
  res.render('login', { title: 'Login' });
};

exports.registerForm = (req, res) => {
  res.render('register', { title: 'Register' });
};

exports.validateRegister = (req, res, next) => {
  req.sanitizeBody('name');
  req.checkBody('name', 'You must supply a name!').notEmpty();
  req.checkBody('email', 'That email address is not valid!').isEmail();
  req.sanitizeBody('email').normalizeEmail({
    remove_dots: false, // treats hosam.hamdy as hosamhamdy
    remove_extension: false, // treats hosam@gmail.com as hosam
    gmail_remove_subaddress: false, // treats hosam@gmail.com as hosam@googlemail.com
  });
  req.checkBody('password', 'Password cannot be blank!').notEmpty();
  req.checkBody('password-confirm', 'Confirm Password cannot be blank!').notEmpty();
  req
    .checkBody('password-confirm', 'Your password fields do not match!')
    .equals(req.body.password);

  const errors = req.validationErrors();

  if (errors) {
    req.flash(
      'error',
      errors.map((err) => err.msg)
    );

    res.render('register', { title: 'Register', body: req.body, flashes: req.flash() });
    return;
  }
  next();
};

exports.register = async (req, res, next) => {
  const user = new User({ name: req.body.name, email: req.body.email });
  // User.register(user, req.body.password);
  const register = promisify(User.register, User);
  await register(user, req.body.password);
  next(); // Pass along to authController.login
};

exports.account = (req, res) => {
  res.render('account', { title: 'Account Details' });
};

exports.updateAccount = async (req, res) => {
  const updates = {
    name: req.body.name,
    email: req.body.email,
  };

  const user = await User.findOneAndUpdate(
    {
      _id: req.user._id, // here we use req.user not req.body because we wanna make sure the data we have is fpr the actual user editing his own profile, not from somemalicous acts, because he can send a new id in the body
    },
    { $set: updates },
    {
      new: true, // asks monogodb to return the newly edited/created user
      runValidators: true,
      context: 'query',
    }
  );

  req.flash('success', 'Successfully updated the account!');

  res.redirect('back'); // redirects to the previous page
};
