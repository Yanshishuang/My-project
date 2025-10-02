/*
Jerome LANDRE - jerome.landre@ju.se
Mira POP - mira.pop@ju.se

Project Web Dev Fun - 2025

Admininistrator login: admin
Administrator password: $2b$12$p5.UuPb9Zh.siIc78Ie.Nu9eGx9d5OLT2pkecedig2P.6CdfL1ZUa
*/
//--- LOAD THE PACKAGES 
const express=require('express')
const {engine}=require('express-handlebars')
const bodyParser=require('body-parser')
const bcrypt=require('bcrypt')
const session=require('express-session')
const sqlite3=require('sqlite3') // load the sqlite3 package
const connectSqlite3 = require('connect-sqlite3') // store the sessions in a SQLite3 database file


//--- DEFINE VARIABLES AND CONSTANTS
const port=8080
const app=express()

//const adminPassword='wdf#2025'
const adminPassword='$2b$12$p5.UuPb9Zh.siIc78Ie.Nu9eGx9d5OLT2pkecedig2P.6CdfL1ZUa'

//----------------------
//--- DEFINE MIDDLEWARES
//----------------------
//--- DEFINE THE PUBLIC DIRECTORY AS STATIC
app.use(express.static('public'))
//--- DEFINE HANDLEBARS AS THE TEMPLATING ENGINE
app.engine('handlebars', engine())
app.set('view engine', 'handlebars')
app.set('views', './views')
//--- USE THE BODY-PARSER MIDDLEWARE TO USE POST FORMS
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

///--- CONNECT TO DATABASE
const dbFile='my-project-data.sqlite3.db'
db=new sqlite3.Database(dbFile)
//--- STORE SESSIONS IN THE DATABASE
const SQLiteStore = connectSqlite3(session) // store sessions in the database
//--- DEFINE THE SESSION
app.use(session({ // define the session
    store: new SQLiteStore({db: "session-db.db"}),
    "saveUninitialized": false,
    "resave": false,
    "secret": "This123Is@Another#456GreatSecret678%Sentence"
}))


//--- MAKE THE SESSION AVAILABLE IN ALL HANDLEBAR FILES AT ONCE!
app.use((request, response, next) => {
    response.locals.session = request.session
    next()
})

//--- DEFINE THE ROUTES AND METHODS
app.get('/', (request, response) => {
    console.log('---> SESSION INFORMATION: ', JSON.stringify(request.session))
    response.render('home') // the landing page information
})
app.get('/contact', (request, response) => {
    response.render('contact') // the contact information
})
app.get('/listofprojects', (request,response) => {
    db.all('SELECT * FROM projects', (err, theProjects) => {
        if (err) {
            console.error(err.message);
            const model = { error: "Error retrieving projects from the database." }
            response.render('projects', model);
        } else {
            console.log(`---> Retrieved ${theProjects.length} projects from the database.`);
            console.log(`---> Projects: ${JSON.stringify(theProjects)}`);
            const model = { projects: theProjects };
            response.render('projects', model); // the list of persons
        }
    });
})
app.get('/listofskills', (request,response) => {
    db.all('SELECT * FROM skills', (err, theSkills) => {
        if (err) {
            console.error(err.message);
            const model = { error: "Error retrieving skills from the database." }
            response.render('skills', model);
        } else {
            console.log(`---> Retrieved ${theSkills.length} projects from the database.`);
            console.log(`---> Projects: ${JSON.stringify(theSkills)}`);
            const model = { skills: theSkills };
            response.render('skills', model); // the list of persons
        }
    });
})
//--- LOGIN FORM
app.get('/login', (request, response) => {
    response.render('login') // the login form to send to the client
})
//--- LOGIN PROCESSING
app.post('/login', (request, response) => {
    // the treatment of the data received from the client form
    console.log(`Here comes the data received from the form on the client: ${request.body.un} - ${request.body.pw} `)
    if (request.body.un==="admin") {
        bcrypt.compare(request.body.pw, adminPassword, (err, result) => {
            if (err) {
                console.log('Error in password comparison')
                model = { error: "Error in password comparison." }
                response.render('login', model)
            }
            if (result){
                request.session.isLoggedIn=true
                request.session.un=request.body.un
                request.session.isAdmin=true
                console.log('---> SESSION INFORMATION: ', JSON.stringify(request.session)) 
                response.render('loggedin')
            } else {
                console.log('Wrong password')
                model = { error: "Wrong password! Please try again." }
                response.render('login', model)
            }
        })
    } else {
        console.log('Wrong username')
        model = { error: "Wrong username! Please try again." }
        response.render('login', model)
    }
})


//--- LOGOUT PROCESSING
app.get('/logout', (req, res) => {
    req.session.destroy( (err) => { // destroy the current session
        if (err) {
            console.log("Error while destroying the session: ", err)
            res.redirect('/') // go back to homepage
        } else {
            console.log('Logged out...')
            res.redirect('/') // go back to homepage
        }
    })
})

//--- LISTEN TO INCOMING REQUESTS
app.listen(port, () => {
    hashPassword("wdf#2025", 12); // hash the password "wdf#2025"
    console.log(`Server running on http://localhost:${port}`)
})

function hashPassword(pw, saltRounds) {
    bcrypt.hash(pw, saltRounds, function(err, hash) {
        if (err) {
            console.log('---> Error hashing password:', err);
        } else {
            console.log(`---> Hashed password: ${hash}`);
        }
    });
}


