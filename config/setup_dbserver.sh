#!/bin/bash

# Create the database

echo "Setting up postgres database 'welldone'..."
sudo -upostgres createdb -O dbadmin welldone || true

