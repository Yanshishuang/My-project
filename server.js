//Load module
const express = require ('express');
const { engine } = require ('express-handlebars');
const bodyParser = require ('body-parser');
const session = require('express-session');
const sqlite3 = require('sqlite3');
const SQLiteStore = require('connect-sqlite3')(session);

// Create application
const app = express();
const port = 8080;

//Connect to database
const db = new sqlite3.Database('./my-project-data.sqlite3.db');

// Set the static resource directory
app.use(express.static('public'));

// Set up the Handlebars template engine
app.engine('handlebars',engine());
app.set('view engine','handlebars');
app.set('views','./views');

// Process POST data
app.use(session({
    store: new SQLiteStore({ db: "session-db.db"}),
    saveUninitialized: false,
    resave: false,
    secret: "YourSecretKeyHere"
}));

// Routing - Home Page
app.get('/',(req,res)=> {
    res.render('home');   
});

// Routing - Books Page
app.get('/books',(req,res)=> {
    db.all(`SELECT books.*, genres.name AS genre_name
        FROM books
        INNER JOIN genres ON books.genre_id = genres.id`, 
        [], 
        (err,rows) =>{
            if(err) {
                console.log(err);
            }
            res.render('books',{ books: rows, title: "books"});
        }
    );  
});

// Routing - Login Page
app.get('/login',(req,res)=> {
    res.render('login');   
});

// Start the server
app.listen(port,() =>{
    console.log(`Server runing at http://localhost:${port}`);
});