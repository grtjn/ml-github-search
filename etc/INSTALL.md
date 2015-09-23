# Installing services

The code includes a service script, and service configs to make installing a middle-tier service as easy as possible. The following files are involved:

- etc/init.d/node-express-service (generic express server service script)
- etc/{env}/conf.sh (env specific service configuration, any env name allowed)
- boot.js (entry point for express service, calls out to node-app.js)
- node-server/* (called by both gulp serve-* and boot.js)

The conf.sh is 'sourced' by the service script, and allows overriding the built-in defaults. Usually you only need to override SOURCE\_DIR, APP\_PORT, and ML\_PORT. Make sure they match the appropriate environment.

Next step is to push all source files to the appropriate server. The following assumes it was dropped under /space/projects/ in a folder called for instance github-search.live. Take these steps to install the services:

- cd /etc
- sudo ln -s /space/projects/github-search.live/etc/{env} github-search
- cd /etc/init.d
- sudo ln -s /space/projects/github-search.live/etc/init.d/node-express-service github-search
- sudo chkconfig --add github-search
- sudo chkconfig --levels 2345 github-search on

NOTE: make sure bower, gulp, and forever are installed, and npm install, and bower install have run, before starting the services! And you probably want to bootstrap, and deploy modules as well.

Next to start them, use the following commands (from any directory):

- sudo service github-search start

These services will also print usage without param, but they support info, restart, start, status, and stop. The info param is very useful to check the settings.

# Initializing httpd

Next to this, you likely want to enable the httpd daemon. Only ports 8000 through 8099 are exposed on demo servers, and we usually deliberately configure (part of) the application outside that scope. Add a forwarding rule for the appropriate dns:

- sudo chkconfig --levels 2345 httpd on
- sudo service httpd stop
- sudo vi /etc/httpd/conf/httpd.conf, uncomment the line with:

NameVirtualHost *:80

- and append:

<VirtualHost *:80>
  ServerName github-search.demo.marklogic.com
  RewriteEngine On
  RewriteRule ^(.*)$ http://localhost:9876$1 [P]
</VirtualHost>

- sudo service httpd start
