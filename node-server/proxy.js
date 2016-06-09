/*jshint node: true */

'use strict';

var router = require('express').Router();
var http = require('http');
var options = require('./utils/options')();

// ==================================
// MarkLogic REST API endpoints
// ==================================

//
// To not require authentication for a specific route, simply use the route below.
// Copy and change according to your needs.
//
//router.get('/my/route', function(req, res) {
//  noCache(res);
//  proxy(req, res);
//});

// For any other GET request, proxy it on to MarkLogic.
router.get('*', function(req, res) {
  noCache(res);
  if (req.session.user === undefined) {
    res.status(401).send('Unauthorized');
  } else {
    proxy(req, res);
  }
});

// Require authentication for POST requests
router.post('/suggest', function(req, res) {
  noCache(res);
  if (req.session.user === undefined) {
    res.status(401).send('Unauthorized');
  } else {
    proxy(req, res);
  }
});
router.post('/values*', function(req, res) {
  noCache(res);
  if (req.session.user === undefined) {
    res.status(401).send('Unauthorized');
  } else {
    proxy(req, res);
  }
});
 
/*
// PUT requires special treatment, as a user could be trying to PUT a profile update..
router.put('*', function(req, res) {
  noCache(res);
  // For PUT requests, require authentication
  if (req.session.user === undefined) {
    res.status(401).send('Unauthorized');
  } else if (req.path === '/v1/documents' &&
    req.query.uri.match('/api/users/') &&
    req.query.uri.match(new RegExp('/api/users/[^(' + req.session.user.name + ')]+.json'))) {
    // The user is trying to PUT to a profile document other than his/her own. Not allowed.
    res.status(403).send('Forbidden');
  } else {
    if (req.path === '/v1/documents' && req.query.uri.match('/users/')) {
      var json = req.body.user ? req.body : JSON.parse(req.body);
      req.session.user.profile = json.user;
    }
    proxy(req, res);
  }
});

// Require authentication for POST requests
router.post('*', function(req, res) {
  noCache(res);
  if (req.session.user === undefined) {
    res.status(401).send('Unauthorized');
  } else {
    proxy(req, res);
  }
});

// (#176) Require authentication for DELETE requests
router.delete('*', function(req, res) {
  noCache(res);
  if (req.session.user === undefined) {
    res.status(401).send('Unauthorized');
  } else {
    proxy(req, res);
  }
});
*/

function getAuth(options, session) {
  var auth = null;
  if (session.user !== undefined && session.user.name !== undefined) {
    auth =  session.user.name + ':' + session.user.password;
  }
  else {
    auth = options.defaultUser + ':' + options.defaultPass;
  }

  return auth;
}

// Generic proxy function used by multiple HTTP verbs
function proxy(req, res) {
  var queryString = req.originalUrl.split('?')[1];
  var path = '/v1' + req.path + (queryString ? '?' + queryString : '');
  console.log(
    req.method + ' ' + req.path + ' proxied to ' +
    options.mlHost + ':' + options.mlHttpPort + path);
  var mlReq = http.request({
    hostname: options.mlHost,
    port: options.mlHttpPort,
    method: req.method,
    path: path,
    headers: req.headers,
    auth: getAuth(options, req.session)
  }, function(response) {

    res.statusCode = response.statusCode;

    // [GJo] (#67) forward all headers from MarkLogic
    for (var header in response.headers) {
      res.header(header, response.headers[header]);
    }

    response.on('data', function(chunk) {
      res.write(chunk);
    });
    response.on('end', function() {
      res.end();
    });
  });

  if (req.body !== undefined) {
    mlReq.write(JSON.stringify(req.body));
    mlReq.end();
  }

  mlReq.on('error', function(e) {
    console.log('Problem with request: ' + e.message);
  });
}

function noCache(response){
  response.append('Cache-Control', 'no-cache, must-revalidate');     // HTTP 1.1 - must-revalidate
  response.append('Pragma',        'no-cache');                      // HTTP 1.0
  response.append('Expires',       'Sat, 26 Jul 1997 05:00:00 GMT'); // Date in the past
}

module.exports = router;
