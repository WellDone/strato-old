echo "Initializing WellDone database..."

cd /vagrant/app
export DATABASE_URL=tcp://dbadmin:GikmnmJKDOB3@localhost:5432/welldone
node db/migrate.js --force
node db/seed.js