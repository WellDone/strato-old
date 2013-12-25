#!/bin/bash
echo "Setting up appserver..."

# Use forever to start the server services
cd /vagrant/app
npm update

./compileCSS.sh