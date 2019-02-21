const crypto = require('crypto');

const childProcess = require('child_process');
const express = require('express');
const mailjet = require('node-mailjet')
  .connect(process.env.MJ_APIKEY_PUBLIC, process.env.MJ_APIKEY_PRIVATE);

const models = require('../modules/models');
const session = require('../modules/session');

const router = express.Router();

const authenticateOrcid = (code, type) => {
  return new Promise((resolve, reject) => {
    const curl = `curl -L -k -H "Accept: application/json" --data "client_id=${process.env.ORCID_CLIENT_ID}&client_secret=${process.env.ORCID_CLIENT_SECRET}&grant_type=authorization_code&code=${code}&redirect_uri=${process.env.EXPRESS_ADDRESS}/${type}" "https://orcid.org/oauth/token"`;
    childProcess.exec(curl, (err, stdout, stderr) => {
      if (err) { reject(err); }
      const result = JSON.parse(stdout);
      if (result.orcid) {
        resolve(result.orcid);
      }
      reject(result.error);
    });
  });
};

const encrypt = (text, iv) => {
  const cipher = crypto.createCipheriv(process.env.ENCRYPTION_ALGORITHM, Buffer.from(process.env.ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

const decrypt = (text, iv) => {
  const decipher = crypto.createDecipheriv(process.env.ENCRYPTION_ALGORITHM, Buffer.from(process.env.ENCRYPTION_KEY), Buffer.from(iv, 'hex'));
  let decrypted = decipher.update(text, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

const sendMail = (token, email) => {
  const iv = crypto.randomBytes(16);
  return mailjet
    .post('send', { 'version': 'v3.1' })
    .request({
      'Messages': [
        {
          'From': {
            'Email': process.env.SENDER_EMAIL_ADDRESS,
            'Name': 'eBlocIdentity Admin'
          },
          'To': [
            {
              'Email': email
            }
          ],
          'Subject': 'eBlocIdentity Account Verification',
          'TextPart': `Hello,\n\nPlease verify your account by clicking the link:\n${process.env.EXPRESS_ADDRESS}/confirm/${iv.toString('hex')}/${encrypt(token, iv)}\nThis link expires in 24 hours.`
        }
      ]
    });
};

router.get('/', session.isSignedIn, (req, res) => {
  const message = req.session.message;
  req.session.message = '';
  res.render('index', { message, user: req.user });
});

router.get('/signout', session.isSignedIn, (req, res) => {
  req.logout();
  req.session.message = 'You have successfully signed out.';
  res.redirect('/signin');
});

router.get('/signin', session.isSignedOut, async (req, res) => {
  let message = req.session.message;
  req.session.message = '';
  let orcid = '';
  if (req.query.code) {
    await authenticateOrcid(req.query.code, 'signin').then(result => {
      orcid = result;
    }).catch(err => {
      message = err;
    });
  }
  res.render('register', { message, signin: true, orcid, clientId: process.env.ORCID_CLIENT_ID, redirectUri: process.env.EXPRESS_ADDRESS + '/signin' });
});

router.post('/signin', session.isSignedOut, (req, res, next) => {
  session.passport.authenticate(req.body.email ? 'local-email' : 'local-orcid', (err, user, info) => {
    if (err) { return next(err); }
    if (!user) {
      req.session.message = info.message;
      return res.redirect('/signin');
    }
    req.logIn(user, err => {
      if (err) { return next(err); }
      res.redirect('/');
    });
  })(req, res, next);
});

router.get('/signup', session.isSignedOut, async (req, res) => {
  let message = req.session.message;
  req.session.message = '';
  let orcid = '';
  if (req.query.code) {
    await authenticateOrcid(req.query.code, 'signup').then(result => {
      orcid = result;
    }).catch(err => {
      message = err;
    });
  }
  res.render('register', { message, signin: false, orcid, clientId: process.env.ORCID_CLIENT_ID, redirectUri: process.env.EXPRESS_ADDRESS + '/signup' });
});

router.post('/signup', session.isSignedOut, (req, res, next) => {
  // Make sure this account doesn't already exist
  models.User.findOne({ address: req.body.address.toLowerCase() }, (err, user) => {
    if (err) { return next(err); }
    // Make sure user doesn't already exist
    if (user) {
      req.session.message = 'This Ethereum address is already associated with another account.';
      return res.redirect('/signup');
    }

    if (req.body.email) {
      // Create and save the user
      user = new models.User({ address: req.body.address.toLowerCase(), email: req.body.email });
      user.save(err => {
        if (err) { return next(err); }

        // Create a verification token for this user
        const token = new models.Token({ _userId: user._id, token: crypto.randomBytes(16).toString('hex') });

        // Save the verification token
        token.save(err => {
          if (err) { return next(err); }

          // Send the email
          sendMail(token.token, user.email).then(result => {
            req.session.message = `A verification email has been sent to ${user.email}.`;
            res.redirect('/signup');
          }).catch(err => {
            return next(err);
          });
        });
      });
    } else {
      user = new models.User({ address: req.body.address.toLowerCase(), orcid: req.body.orcid, isVerified: true });
      user.save(err => {
        if (err) { return next(err); }
        req.session.message = 'Your account has successfully created. You can now sign in.';
        res.redirect('/signin');
      });
    }
  });
});

router.get('/confirm/:iv/:token', session.isSignedOut, (req, res, next) => {
  const decryptedToken = decrypt(req.params.token, req.params.iv);
  // Find a matching token
  models.Token.findOne({ token: decryptedToken }, (err, token) => {
    if (err) { return next(err); }
    if (!token) {
      req.session.message = 'We were unable to find a valid token. Your token may have expired.';
      return res.redirect('/signin');
    }

    // If we found a token, find a matching user
    models.User.findOne({ _id: token._userId }, (err, user) => {
      if (err) { return next(err); }
      if (!user) {
        req.session.message = 'We were unable to find a user for this token.';
        return res.redirect('/signin');
      }
      if (user.isVerified) {
        req.session.message = 'This user has already been verified.';
        return res.redirect('/signin');
      }

      // Verify and save the user
      user.isVerified = true;
      user.save(err => {
        if (err) { return next(err); }
        req.session.message = 'Your account has successfully created. You can now sign in.';
        res.redirect('/signin');
      });
    });
  });
});

module.exports = router;
