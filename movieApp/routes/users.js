var express = require('express');
var router = express.Router();
const db = require('../db');
const bcrypt = require(`bcrypt`);
const expressSession = require('express-session')

//PUT THIS IN YOUR .env!!!
const sessionOptions = {
  secret: "i3rlejofdiaug;lsad",
  resave: false,
  saveUninitialized: false
}

router.use(expressSession(sessionOptions))

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

//In app.js we included this file and we pointed it to /users. 
//So the user file is already at /users or they wouldn't get this piece of middleware
router.post('/registerProcess', (req, res, next) => {
  // res.json(req.body)
  // const username = req.body.username;
  // const email = req.body.email;
  // const password = req.body.password;

  // this is what it looks like destructured: 
  const {username, email, password} = req.body

  const checkUserExistsQuery = `
  SELECT * FROM users WHERE username = $1 OR email = $2`

  db.any(checkUserExistsQuery,[username, email]).then((resp)=>{
    if(resp.length > 0){
      //this user already exists
      res.redirect(`/login?msg=userexists`)
    }
    else{
      //new user -- insert!
      insertUser();
    }
  })


  function insertUser(){
    const insertUserQuery =`INSERT INTO users (username, email, password)
      VALUES
      ($1,$2,$3)
      returning id`
  //you need the .then so that it waits to res.json
  const hash = bcrypt.hashSync(password,10);
  db.one(insertUserQuery, [username, email, hash]).then((resp)=>{
    res.json({
      msg: "useradded"
    })
  })
}
});

router.post('/loginProcess', (req, res)=>{
  const checkUserQuery=`
  select * from users WHERE username=$1`

  const checkUser = db.any(checkUserQuery,[req.body.username])
  checkUser.then((results)=>{
    const correctPass = bcrypt.compareSync(req.body.password, results[0].password)
    console.log(correctPass)
    if (correctPass){
      console.log('PW was correct')
      req.session.username = results.username;
      req.session.loggedin = true;
      req.session.email = results.email;
      res.redirect("/")
      //every single http request (route) is a completely new request
      //Cookies: stores data in the browswer, with a key on the server
      //every single page request the entire cookie is sent to the server
      //Sessions: Stores data on the server, with a key (Cookie) on the browswer.
    }
    else{
      res.send("You can't log in")
    }
  })
  checkUser.catch((error)=>
    res.json({
      msg: "userDoesNotExist"
    }))
})
module.exports = router;
