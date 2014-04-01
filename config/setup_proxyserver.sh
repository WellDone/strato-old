#!/bin/bash

# setup the load balancer and nginx rules
echo "Setting up NGINX proxy..."
rm /etc/nginx/sites-enabled/default
cp /welldone/config/proxy/strato.welldone.org.conf /etc/nginx/sites-enabled/strato.welldone.org.conf

nginx -t

sudo service nginx reload