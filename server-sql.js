var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./db.js');

var bcryptjs = require('bcryptjs');

var PORT = process.env.PORT || 3000;

var todos = [];
var todoNextId = 1;

app.use(bodyParser.json());

app.get('/', function(req, res) {
	res.send('Todo API Root');
});

// GET /todos
app.get('/todos', function(req, res) {
	var where = {};

	if (req.query.hasOwnProperty('completed') && req.query.completed === 'true') {
		where.completed = true;
	} else if (req.query.hasOwnProperty('completed') && req.query.completed === 'false') {
		where.completed = false;
	}

	if (req.query.hasOwnProperty('q') && req.query.q.trim().length > 0) {
		where.description = {
			$like: '%' + req.query.q + '%'
		};
	}

	db.todo.findAll({
		where
	}).then(function(todos) {
		res.json(todos);
	}).catch(function(e) {
		send.status(500).send();
	});
});

// GET /todos/:id
app.get('/todos/:id', function(req, res) {
	db.todo.findById(parseInt(req.params.id, 10)).then(function(todo) {
		if (todo) {
			res.json(todo.toJSON());
		} else {
			res.status(404).send();
		}
	}).catch(function(e) {
		res.status(500).send(e);
	});
});

// POST /todos/:id
app.post('/todos', function(req, res) {
	var body = _.pick(req.body, 'description', 'completed');

	db.todo.create(body).then(function(todo) {
		res.json(todo.toJSON());
	}).catch(function(e) {
		res.status(400).json(e);
	});
});

// DELETE /todos/:id
app.delete('/todos/:id', function(req, res) {
	db.todo.destroy({
			where: {
				id: parseInt(req.params.id, 10)
			}
		})
		.then(function(rowsDeleted) {
			if (rowsDeleted > 0) {
				res.status(204).send();
			} else {
				res.status(404).send({
					error: 'No valid ID'
				});
			}
		}).catch(function(e) {
			res.status(500).send(e);
		});
});

// PUT /todos/:id
app.put('/todos/:id', function(req, res) {
	var body = _.pick(req.body, 'description', 'completed');
	options = {};

	if (body.hasOwnProperty('description')) {
		options.description = body.description;
	}

	if (body.hasOwnProperty('completed')) {
		options.completed = body.completed;
	}

	db.todo.findById(parseInt(req.params.id, 10)).then(function(todo) {
		if (todo) {
			todo.update(options).then(function(todos) {
				res.json(todos.toJSON());
			}, function(e) {
				res.status(400).json(e);
			});
		} else {
			res.status(404).send();
		}
	}, function() {
		res.status(500).send();
	});

});

// POST /user
app.post('/user', function(req, res) {
	var body = _.pick(req.body, 'email', 'password');

	db.user.create(body).then(function(user) {
		res.json(user.toPublicJSON());
	}).catch(function(e) {
		res.status(400).json(e);
	});
});

// POST /users / login
app.post('/user/login', function(req, res) {
	var body = _.pick(req.body, 'email', 'password');

	db.user.authenticate(body).then(function(user) {
		var token = user.generateToken('aunthentication');
		if (token) {
			res.header('Auth', token).json(user.toPublicJSON());
		} else {
			res.status(401).send();
		}
	}, function() {
		res.status(401).send();
	});


});

db.sequelize.sync().then(function() {
	app.listen(PORT, function() {
		console.log('Todo fue bien en el puerto: ' + PORT + '!');
	});
});