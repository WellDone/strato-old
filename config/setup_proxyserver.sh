#!/bin/bash

# setup the load balancer and nginx rules
echo "Setting up NGINX proxy..."
rm /etc/nginx/sites-enabled/default
cp /vagrant/proxy/momo.welldone.org.conf /etc/nginx/sites-enabled/momo.welldone.org.conf

nginx -t

sudo service nginx reload