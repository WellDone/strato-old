#!/bin/bash

# Create the database

echo "Setting up postgres database 'welldone'..."
cd /home
sudo -upostgres createdb -O dbadmin welldone || true

