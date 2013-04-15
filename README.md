# WellDone Mobile Monitoring Framework

Demo site available at http://welldone.herokuapp.com.  It may be slightly out of date.

## Configuration

The following environment variable are available for configuration.  Edit and use startServer.sh to modify them for your own development environment, but the launcher file shouldn't be checked in.

```
export NODE_DEBUG_MODE = 1
export DATABASE_URL    = tcp://user:password@server:5432/Database
export WD_LOG_PATH     = /full/path/to/log/file
export TWILIO_ACCOUNT_SID={your account SID}
export TWILIO_AUTH_TOKEN={your auth token}
export TWILIO_NUMBER=+15555555555
```

## Database Migration

To create or upgrade the database, simply run the following command.  Before attempting the migration, make sure your DATABASE_URL environment variable is set up properly.

```
node db/migrate.js
```

A migration log is stored at db/debug.log.
The schema is kept at db/schema.js and migration steps will (eventually) be stored in db/migrations.

To clear all data from the main tables, use AT YOUR OWN RISK:

```
node db/seed.js --clean
```

Then, to seed the database do the following (see db/data/test.seed for an example and the default seedFile):

```
node db/seed.js [seedFile]
```
