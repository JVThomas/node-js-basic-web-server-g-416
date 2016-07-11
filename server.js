"use strict";

const bcrypt = require('bcrypt');
const http         = require('http');
const finalhandler = require('finalhandler');
const bodyParser = require('body-parser')
const Router       = require('router');
const urlParser = require('url')
const querystring = require('querystring');
let messages = [];
let currentId = 1;
const router = new Router({mergeParams:true});
router.use(bodyParser.json());

class Message{
	constructor(message){
		this.id = currentId;
		this.message = message;
		currentId++;
	}	
}

router.get('/', (request, response) => {
	response.setHeader('Content-Type', 'text/plain; charset=utf-8');
  	response.end("Hello, World!");
});

router.post('/message', (request, response) => {
	let newMessage;
	if(!request.body.message){
		response.statusCode = 400;
		response.statusMessage = "No message given";
		response.end();
		return;
	}
	response.setHeader('Content-Type', 'application/json; charset=utf-8');
	newMessage = new Message(request.body.message);
  	messages.push(newMessage);
  	response.end(JSON.stringify(newMessage.id));
});

router.get('/messages', (request,response) => {
	let url = urlParser.parse(request.url);
	let params = querystring.parse(url.query);

	if(params.encrypt){
		bcrypt.hash(JSON.stringify(messages),10,(error,hash) =>{
			if(error){
				throw new Error();
			}
			response.setHeader('Content-Type', 'text/plain; charset=utf-8');
			response.end(hash);
		});
		return;
	}
	response.setHeader('Content-Type', 'application/json; charset=utf-8');
	response.end(JSON.stringify(messages));	
});

router.get('/message/:id', (request, response) => {
	if(!request.params.id){
		response.statusCode = 400;
		response.statusMessage = "No id given";
		response.end();
		return;
	}

	let url = urlParser.parse(request.url),
	    params = querystring.parse(url.query),
	    foundMsg,
	    targetId = parseInt(request.params.id);

	foundMsg = messages.find((message) =>{
		return message.id == targetId;
	});

	if(!foundMsg){
		response.statusCode = 400;
		response.statusMessage = "No message found with given id";
		response.end();
		return;
	}

	response.setHeader('Content-Type', 'application/json; charset=utf-8');

	if(params.encrypt){
		response.setHeader('Content-Type', 'text/plain; charset=utf-8');
		bcrypt.hash(JSON.stringify(foundMsg),10,(error,hash) =>{
			if(error){
				response.end(error);
			}
			response.end(hash);
			return;
		});
	}
		
	response.end(JSON.stringify(foundMsg));
});

const server = http.createServer((request, response) => {
  router(request, response, finalhandler(request, response));
});

exports.listen = function(port, callback) {
  server.listen(port, callback);
};

exports.close = function(callback) {
  server.close(callback);
};
