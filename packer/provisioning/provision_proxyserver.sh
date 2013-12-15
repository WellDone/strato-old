#!/bin/bash

nginx=stable # use nginx=development for latest development version
add-apt-repository -y ppa:nginx/$nginx
apt-get update 
apt-get install -y nginx

# configure the proxy & load balancer here