const mongoose = require('mongoose');
const User = mongoose.model('User');
const passport = require('passport');
const crypto = require('crypto');
const { promisify } = require('es6-promisify');
const mail = require('../handlers/mail');

exports.login = passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: 'Failed Login!',
  successRedirect: '/',
  successFlash: 'You are now logged in!',
});

exports.logout = (req, res) => {
  req.logout();
  req.flash('success', 'You are now logged out! 👋');
  res.redirect('/');
};

exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
    return;
  }
  req.flash('error', 'Oops! You gotta be logged in to do that!');
  res.redirect('/login');
};

exports.forgot = async (req, res) => {
  // 1. See if user exists
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    req.flash('error', 'No user was found with the specified account');
    return res.redirect('/login');
  }
  // 2. Set reset token & expiry date in their account
  user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordTokenExpires = Date.now() + 3600000; // add an hour of milliseconds (60s * 60m * 1000ms)
  await user.save();
  // 3. Send reset mail
  const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;

  await mail.send({
    user,
    subject: 'Your Password Reset Link',
    resetURL,
    filename: 'password-reset', // Pug template for the email
  });

  req.flash('success', `You've been emailed the reset link!`);
  // 4. redirect to login page
  res.redirect('/login');
};

exports.reset = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordTokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    req.flash('error', 'Password reset token is not valid or has expired!');
    return res.redirect('/login');
  }

  res.render('reset', { title: 'Reset Your Password' });
};

exports.confirmedPasswords = (req, res, next) => {
  if (req.body['password'] === req.body['password-confirm']) {
    next();
    return;
  }
  req.flash('error', 'Password mismatch!');
  res.redirect('back');
};

exports.updatePassword = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordTokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    req.flash('error', 'Password reset token is not valid or has expired!');
    return res.redirect('/login');
  }

  const setPassword = promisify(user.setPassword, user);
  await setPassword(req.body.password);

  user.resetPasswordToken = undefined;
  user.resetPasswordTokenExpires = undefined;

  const updatedUser = await user.save();
  await req.login(updatedUser);
  req.flash('success', 'Password updated successfully! We logged you in too!');
  res.redirect('/');
};
