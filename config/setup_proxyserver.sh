#!/bin/bash

# setup the load balancer and nginx rules
echo "Setting up NGINX proxy..."
rm /etc/nginx/sites-enabled/default
cp /welldone/config/proxy/strato.welldone.org.conf /etc/nginx/sites-enabled/strato.welldone.org.conf

mkdir -p /etc/welldone/ssl
if [ "$APP_CONTEXT" == "DEVELOPMENT" ]; then
	cp /welldone/config/proxy/development_server.key /etc/welldone/ssl/strato.welldone.org.key
	cp /welldone/config/proxy/development_server.crt /etc/welldone/ssl/strato.welldone.org.crt
nginx -t

sudo service nginx reload