//Load module
const express = require("express");
const { engine } = require("express-handlebars");
const bodyParser = require("body-parser");
const session = require("express-session");
const sqlite3 = require("sqlite3");
const SQLiteStore = require("connect-sqlite3")(session);
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const { title } = require("process");

// Create application
const app = express();
const port = 8080;

//Connect to database
const db = new sqlite3.Database("./my-project-data.sqlite3.db");

// Set the static resource directory
app.use(express.static("public"));

// Set up the Handlebars template engine
app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", "./views");

// Process POST data
app.use(
  session({
    store: new SQLiteStore({ db: "session-db.db" }),
    saveUninitialized: false,
    resave: false,
    secret: "YourSecretKeyHere",
  })
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Multer Upload
const storage = multer.diskStorage({
  destination: (req, file, cd) => {
    cd(null, "public/uploads");
  },
  filename: (req, file, cd) => {
    cd(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

//Generate an admin user
const adminPassword = "wdf#2025";
bcrypt.hash(adminPassword, 12, (err, hash) => {
  if (!err) {
    db.run("INSERT OR IGNORE INTO users (username,password) VALUES (?,?)", [
      "admin",
      hash,
    ]);
  }
});

app.use((req, res, next) => {
  res.locals.session = req.session;
  res.locals.isAdmin = req.session.user === "admin";
  next();
});

// Routing - Home Page
app.get("/", (req, res) => {
  res.render("home");
});

// Routing - Books Page
app.get("/books", (req, res) => {
  db.all(
    `SELECT books.*, genres.name AS genre_name
        FROM books
        INNER JOIN genres ON books.genre_id = genres.id`,
    [],
    (err, rows) => {
      if (err) {
        console.log(err);
      }
      const isAdmin = req.session.user === "admin";

      res.render("books", {
        books: rows,
        title: "Books",
        isAdmin,
      });
    }
  );
});
app.get("/books/:id", (req, res) => {
  const id = req.params.id;
  db.get(
    `SELECT books.*, genres.name AS genre_name
        FROM books
        INNER JOIN genres ON books.genre_id = genres.id
        WHERE books.id=?`,
    [id],
    (err, row) => {
      if (err) {
        console.log(err);
        return res.send("Error fetching book");
      }
      res.render("book-detail", {
        ...row,
        title: row.title,
        isAdmin: req.session.user === "admin",
      });
    }
  );
});

//Delete-book

app.get("/delete-book/:id", (req, res) => {
  if (req.session.user !== "admin") {
    return res.status(403).send("Only admin can delete books");
  }
  const id = req.params.id;
  db.run("DELETE FROM books WHERE id=?", [id], (err) => {
    if (err) return res.send("Error deleting book");
    res.redirect("/books");
  });
});

//Edit-book

app.get("/edit-book/:id", (req, res) => {
  if (req.session.user !== "admin")
    return res.status(403).send("Only admin can edit");

  const id = req.params.id;

  db.get("SELECT * FROM books WHERE id=?", [id], (err, book) => {
    if (err || !book) return res.send("Error fetching book");

    db.all("SELECT * FROM genres", [], (err, genres) => {
      if (err) return res.send("Error fetching genres");

      genres = genres.map((g) => ({
        ...g,
        selected: g.id === book.genre_id ? "selected" : "",
      }));

      res.render("edit-book", { book, genres });
    });
  });
});

app.post("/edit-book/:id", upload.single("cover"), (req, res) => {
  if (req.session.user !== "admin")
    return res.status(403).send("Only admin can edit");

  const id = req.params.id;
  const { title, author, genre_id, description, oldCover } = req.body;

  let coverPath = oldCover;
  if (req.file) coverPath = "/uploads/" + req.file.filename;

  db.run(
    "UPDATE books SET title=?, author=?, cover=?, genre_id=?, description=? WHERE id=?",
    [title, author, coverPath, genre_id, description, id],
    (err) => {
      if (err) return res.send("Error updating book");
      res.redirect("/books/" + id);
    }
  );
});
// Routing - Add Book Page

app.get("/add-book", (req, res) => {
  db.all("SELECT * FROM genres", [], (err, rows) => {
    if (err) console.log(err);
    res.render("add-book", { genres: rows, title: "Add Book" });
  });
});

app.post("/add-book", upload.single("cover"), (req, res) => {
  const { title, author, genre_id, description } = req.body;
  let coverPath = "";

  if (req.file) {
    coverPath = "/uploads/" + req.file.filename;
  }

  db.run(
    `INSERT INTO books (title,author,cover,genre_id,description) VALUES (?,?,?,?,?)`,
    [title, author, coverPath, genre_id, description],
    function (err) {
      if (err) {
        console.log(err);
        res.send("Error adding book");
      } else {
        res.redirect("/books");
      }
    }
  );
});

// Routing - Login Page
app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username=?", [username], (err, user) => {
    if (user && bcrypt.compareSync(password, user.password)) {
      req.session.user = username;
      res.redirect("/");
    } else {
      res.render("login", {
        error: "Wrong username or password",
        title: "Login",
      });
    }
  });
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) console.log(err);
    res.redirect("/");
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server runing at http://localhost:${port}`);
});
