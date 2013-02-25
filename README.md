# WellDone Mobile Monitoring Framework

Demo site available at http://welldone.herokuapp.com

## Configuration

The following environment variable are available for configuration.  Edit and use startServer.sh to modify them for your own development environment, but the launcher file shouldn't be checked in.

```
export NODE_DEBUG_MODE = 1
export DATABASE_URL    = tcp://user:password@server:5432/Database
export WD_LOG_PATH     = /full/path/to/log/file
```

## Database Migration

To create or upgrade the database, simply run the following command.  Before attempting the migration, make sure your DATABASE_URL environment variable is set up properly.

```
node db/migrate.db
```

A migration log is stored at db/debug.log.

The schema is kept at db/schema.js and migration steps will (eventually) be stored in db/migrations.
