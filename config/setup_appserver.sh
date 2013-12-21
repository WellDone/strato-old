#!/bin/bash
echo "Setting up appserver..."

# Use forever to start the server services
mkdir -p /home/application
chown application:application /home/application

cd /vagrant/app
npm update

./compileCSS.sh
