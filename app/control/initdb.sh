echo "Initializing WellDone database..."

cd /welldone/app
export DATABASE_URL=postgres://dbadmin:GikmnmJKDOB3@localhost:5432/welldone

if [ "$1" == "true" ]; then
	node db/migrate.js --force
	node db/seed.js
else
	node db/migrate.js
fi