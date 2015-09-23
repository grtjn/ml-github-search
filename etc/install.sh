#!/bin/sh

cd /etc
sudo ln -s /space/projects/github-search.live/etc/prod github-search
cd /etc/init.d
sudo ln -s /space/projects/github-search.live/etc/init.d/node-express-service github-search
sudo chkconfig --add github-search
sudo chkconfig --levels 2345 github-search on

sudo service github-search start
