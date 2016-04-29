var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./db.js');

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
	var variable = _.findWhere(todos, {
		id: parseInt(req.params.id, 10)
	});
	if (variable) {
		todos = _.without(todos, variable)
		res.send(variable);
	} else {
		res.status(404).send();
	}
});

// PUT /todos/:id
app.put('/todos/:id', function(req, res) {
	var variable = _.findWhere(todos, {
		id: parseInt(req.params.id, 10)
	});
	var body = _.pick(req.body, 'description', 'completed');
	var newBody = {};

	if (!variable) {
		return res.status(404).send();
	}

	if (body.hasOwnProperty('completed') && _.isBoolean(body.completed)) {
		newBody.completed = body.completed;
	} else if (body.hasOwnProperty('completed')) {
		return res.status(400).send();
	}


	if (body.hasOwnProperty('description') && _.isString(body.description) && body.description.trim().length > 0) {
		newBody.description = body.description.trim();
	} else if (body.hasOwnProperty('description')) {
		return res.status(400).send();
	}

	res.json(_.extend(variable, newBody));

});

db.sequelize.sync().then(function() {
	app.listen(PORT, function() {
		console.log('Todo fue bien en el puerto: ' + PORT + '!');
	});
});