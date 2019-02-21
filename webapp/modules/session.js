const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const models = require('./models');

passport.use('local-email', new LocalStrategy({ usernameField: 'address', passwordField: 'email' }, (username, password, done) => {
  models.User.findOne({ address: username.toLowerCase(), email: password }, (err, user) => {
    if (err) { return done(err); }
    if (!user) { return done(null, false, { message: 'User is not found.' }); }
    if (!user.isVerified) { return done(null, false, { message: 'User is not verified yet.' }); }
    done(null, user);
  });
}));

passport.use('local-orcid', new LocalStrategy({ usernameField: 'address', passwordField: 'orcid' }, (username, password, done) => {
  models.User.findOne({ address: username.toLowerCase(), orcid: password }, (err, user) => {
    if (err) { return done(err); }
    if (!user) { return done(null, false, { message: 'User is not found.' }); }
    if (!user.isVerified) { return done(null, false, { message: 'User is not verified yet.' }); }
    done(null, user);
  });
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  models.User.findById(id, (err, user) => {
    done(err, user);
  });
});

module.exports.passport = passport;

module.exports.isSignedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.message = 'Please register to view this page.';
    return res.redirect('/signin');
  }
  next();
};

module.exports.isSignedOut = (req, res, next) => {
  if (req.isAuthenticated()) {
    req.session.message = 'You are already signed in.';
    return res.redirect('/');
  }
  next();
};
