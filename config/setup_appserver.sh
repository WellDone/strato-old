#!/bin/bash
echo "Setting up appserver..."

# Use forever to start the server services

echo 'applicationpasswd' | sudo -uapplication bash - <<EOF
PORT=8080
forever start -p /var/log/welldone_server/.forever /vagrant/app/server.js
EOF