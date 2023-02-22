const mongoose = require('mongoose');
const Store = mongoose.model('Store');

exports.homePage = (req, res) => {
  res.render('index');
};

exports.addStore = (req, res) => {
  res.render('editStore', { title: 'Add Store' });
};

exports.createStore = async (req, res) => {
  const store = await new Store(req.body).save();
  req.flash('success', `Successfully created [${store.name}]!, Care to leave a review?`);
  res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
  // 1. Query the DB for all available stores
  const stores = await Store.find();
  res.render('stores', { title: 'Stores', stores });
};

exports.editStore = async (req, res) => {
  // 1. Get store data from DB
  const store = await Store.findOne({ _id: req.params.id });
  // 2. Confirm the user owns the store
  //TODO

  // 3. Render out the edit form
  res.render('editStore', { title: `Edit ${store.name}`, store });
};

exports.updateStore = async (req, res) => {
  // find and update the store
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, //returns the new store instead of the old one
    runValidators: true,
  }).exec();
  // redirect them to the store and tell them it worked
  req.flash(
    'success',
    `Successfully updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}">View Store 👀</a>`
  );
  res.redirect(`/stores/${store._id}/edit`);
};
