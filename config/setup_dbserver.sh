#!/bin/bash

# Create the database

echo "Setting up postgres database 'welldone'..."
sudo -upostgres createuser dbadmin || true
sudo -upostgres psql -c "ALTER USER dbadmin WITH PASSWORD 'GikmnmJKDOB3'"
sudo -upostgres createdb -O dbadmin welldone || true

