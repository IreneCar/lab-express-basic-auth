// routes/auth.routes.js
const { Router } = require('express');
const router = new Router();

// other imports
const User = require('../models/User.model');

// the setup code skipped
const bcryptjs = require('bcryptjs');
const saltRounds = 10;

// require auth middleware
const { isLoggedIn, isLoggedOut } = require('../middleware/route-guard.js');

// GET route ==> to display the signup form to users
router.get('/signup', (req, res) => res.render('auth/signup'));


// POST route ==> to process form data
router.post('/signup', (req, res, next) => {
  // console.log("The form data: ", req.body);
 
  const { username, email, password } = req.body;

    // make sure users fill all mandatory fields:
    if (!username || !email || !password) {
      res.render("auth/signup", {
        errorMessage: "All fields are mandatory. Please provide your username, email and password."
      });
      return;
    }
  
    // make sure passwords are strong:
    const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
    if (!regex.test(password)) {
      res.status(500).render("auth/signup", {
        errorMessage:
          "Password needs to have at least 6 chars and must contain at least one number, one lowercase and one uppercase letter."
      });
      return;
    }
 
  bcryptjs
    .genSalt(saltRounds)
    .then(salt => bcryptjs.hash(password, salt))
    .then(hashedPassword => {
      return User.create({
        // username: username
        username,
        email,
        // passwordHash => this is the key from the User model
        //     ^
        //     |            |--> this is placeholder (how we named returning value from the previous method (.hash()))
        passwordHash: hashedPassword
      });
    })
    .then(userFromDB => {
      console.log('Newly created user is: ', userFromDB);
      res.redirect('/userProfile');
    })

    .catch(error => next(error));

});





//////////// L O G I N ///////////
 
// GET route ==> to display the login form to users
router.get("/login", isLoggedOut, (req, res) => res.render("auth/login"));

// POST login route ==> to process form data
router.post("/login", isLoggedOut, (req, res, next) => {
  console.log("SESSION =====> ", req.session);
  const { email, password } = req.body;
 
  if (email === '' || password === '') {
    res.render('auth/login', {
      errorMessage: 'Please enter both, email and password to login.'
    });
    return;
  }
 
  User.findOne({ email })
    .then(user => {
      if (!user) {
        res.render('auth/login', { errorMessage: 'Email is not registered. Try with other email.' });
        return;
      } else if (bcryptjs.compareSync(password, user.passwordHash)) {
        res.render('users/user-profile', { user });
        req.session.currentUser = user;
        res.redirect('/userProfile');
      } else {
        return res.render('auth/login', { errorMessage: 'Incorrect password.' });
       
      }
    })
    .catch(error => next(error));

});

//                         .: ADDED :.
router.get("/userProfile", isLoggedIn, (req, res) => {
  res.render("users/user-profile", { userInSession: req.session.currentUser });
});

//                     .: ADDED :.
router.post("/logout", isLoggedIn, (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

module.exports = router;
