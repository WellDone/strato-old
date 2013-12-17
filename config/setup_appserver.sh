#!/bin/bash
echo "Setting up appserver..."

# create the app user, start the server services
useradd application
echo 'applicationpasswd' | passwd application

npm install forever -g
sudo -uapplication forever