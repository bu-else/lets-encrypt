'use strict';

const LEX = require('greenlock-express');
const app = require('express')();
const http = require('http');
const https = require('https');

// Ensure we don't try to register a certificate unless running on a production server
var serverUrl = '';
if (process.env.NODE_ENV === 'production') {
  serverUrl = 'https://acme-v01.api.letsencrypt.org/directory';
} else {
  serverUrl = 'staging';
}

//
var lex = LEX.create({
  server: serverUrl,
  challenges: {
    'http-01': require('le-challenge-fs').create({
      webrootPath: '~/letsencrypt/var/:hostname'
    })
  },
  store: require('le-store-certbot').create({
    webrootPath: '~/letsencrypt/var/:hostname'
  }),
  approveDomains: approveDomains,
  debug: false
});

// Validate the domain
function approveDomains(opts, certs, cb) {
  if (!/\.multiparty\.io/.test(opts.domain) && opts.domain !== 'multiparty.io') {
    console.error("bad domain '" + opts.domain + "', not a subdomain of multiparty.io");
    cb(null, null);
    return;
  }

  if (certs) {
    opts.domains = certs.altnames;
  }
  else {
    opts.domains = ['multiparty.io'];
    opts.email = 'fjansen@bu.edu';
    opts.agreeTos = true;
  }
  cb(null, {options: opts, certs: certs});
}

// Run server on port 80 and 443 in production
if (process.env.NODE_ENV === 'production') {
  // Redirect port 80 traffic to 443
  http.createServer(lex.middleware(require('redirect-https')())).listen(80, function () {
    console.log("Listening for ACME http-01 challenges on", this.address());
  });

  https.createServer(lex.httpsOptions, lex.middleware(app)).listen(443, function () {
    console.log("Listening for ACME tls-sni-01 challenges and serve app on", this.address());
  });
} else {
  // Run server on port 8080 for development
  http.createServer(lex.middleware(app)).listen(8080, function () {
    console.log("Listening for ACME http-01 challenges on", this.address());
  });
}

app.use('/', function (req, res) {
  res.end('Hello, World!');
});
