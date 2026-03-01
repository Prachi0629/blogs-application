const express = require('express');
const session = require('express-session');
const pool = require('./db'); // PostgreSQL config
const bcrypt = require('bcryptjs');

const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8081;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true}));
app.use(express.static(path.join(__dirname, 'public')));

// Session setup
app.use(session({
  secret: 'blog123',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // use true only with HTTPS
}));

// Middleware to protect pages
function ensureAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }
  res.redirect('/login-register.html');
}

// ✅ Register user
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).send('Missing required fields');
  }

  try {
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).send('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3)', [name, email, hashedPassword]);

    req.session.user = { name, email };
    return res.redirect('/login-register.html?registered=1'); // ✅ success message trigger
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error registering user');
  }
});


// ✅ Login user
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(400).send('User not found');
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).send('Incorrect password');
    }

    req.session.user = { name: user.name, email: user.email }; // store name too
    return res.redirect('/index.html'); // redirect after login
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error logging in');
  }
});

// ✅ Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login-register.html');
});

// ✅ Check session
app.get('/check-session', (req, res) => {
  if (req.session.user) {
    res.sendStatus(200);
  } else {
    res.sendStatus(401);
  }
});

// ✅ Get user info
app.get('/get-user', (req, res) => {
  if (req.session.user) {
    res.json(req.session.user);
  } else {
    res.status(401).json({ error: 'Not logged in' });
  }
});

// ✅ Serve protected pages
app.get('/index.html', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});
app.get('/blog1.html', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/blog1.html'));
});
app.get('/blog2.html', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/blog2.html'));
});
app.get('/blog3.html', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/blog3.html'));
});
app.get('/blog4.html', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/blog4.html'));
});
app.get('/blog5.html', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/blog5.html'));
});
app.get('/blog6.html', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/blog6.html'));
});
app.get('/blog7.html', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/blog7.html'));
});
app.get('/blog8.html', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/blog8.html'));
});

// ✅ Serve login/register page
app.get('/login-register.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/login-register.html'));
});



// Add comment
// Like a blog post
app.post('/like', async (req, res) => {
  if (!req.session.user) return res.sendStatus(401);
  const { blogId } = req.body;
  const user = await pool.query('SELECT id FROM users WHERE email = $1', [req.session.user.email]);
  const user_id = user.rows[0].id;

  const exists = await pool.query('SELECT * FROM likes WHERE blog_id = $1 AND user_id = $2', [blogId, user_id]);
  if (exists.rows.length === 0) {
    await pool.query('INSERT INTO likes (blog_id, user_id, username) VALUES ($1, $2, $3)', [
      blogId, user_id, req.session.user.name
    ]);
  }

  res.sendStatus(200);
});

// Get like count
app.get('/likes/:blogId', async (req, res) => {
  const result = await pool.query('SELECT COUNT(*) FROM likes WHERE blog_id = $1', [req.params.blogId]);
  res.json({ count: result.rows[0].count });
});

// Post comment
app.post('/comment', async (req, res) => {
  if (!req.session.user) return res.sendStatus(401);
  const { blogId, text } = req.body;
  const user = await pool.query('SELECT id FROM users WHERE email = $1', [req.session.user.email]);
  const user_id = user.rows[0].id;

  await pool.query('INSERT INTO comments (blog_id, user_id, username, text) VALUES ($1, $2, $3, $4)', [
    blogId, user_id, req.session.user.name, text
  ]);
  res.sendStatus(200);
});

// Get comments for blog
app.get('/comments/:blogId', async (req, res) => {
  const blogId = req.params.blogId;
  const userEmail = req.session.user?.email || null;

  const userRes = userEmail
    ? await pool.query('SELECT id FROM users WHERE email = $1', [userEmail])
    : { rows: [] };

  const user_id = userRes.rows[0]?.id || null;

  const result = await pool.query('SELECT id, username, text, user_id FROM comments WHERE blog_id = $1 ORDER BY id DESC', [blogId]);
  

const comments = result.rows.map(c => ({
    id: c.id,
    username: c.username,
    text: c.text,
    canDelete: user_id && user_id === c.user_id
  }));
  res.json(comments);
});

// Delete comment
app.delete('/comment/:id', async (req, res) => {
  if (!req.session.user) return res.sendStatus(401);

  const comment = await pool.query('SELECT * FROM comments WHERE id = $1', [req.params.id]);
  if (comment.rows.length === 0) return res.sendStatus(404);

  const user = await pool.query('SELECT id FROM users WHERE email = $1', [req.session.user.email]);
  const user_id = user.rows[0].id;

  if (comment.rows[0].user_id !== user_id) return res.sendStatus(403);

  await pool.query('DELETE FROM comments WHERE id = $1', [req.params.id]);
  res.sendStatus(200);
});







// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
