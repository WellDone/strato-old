#!/bin/bash

echo "Installing Node and NPM..."
apt-get update
apt-get install -y python-software-properties python g++ make
add-apt-repository -y ppa:chris-lea/node.js
apt-get update
apt-get install -y nodejs

npm install -g forever

echo "Creating 'application' user..."
useradd application
echo $'6MQrXRqGmOS8\n6MQrXRqGmOS8' | (passwd application)