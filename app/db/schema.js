var schema = {
	version: 2
}

schema.tables = {
  monitors: 
  				"id SERIAL PRIMARY KEY," +
					"name text UNIQUE," +
					"location point," +
					"gsmid varchar(20) UNIQUE NOT NULL",
  groups: 
  				"id SERIAL PRIMARY KEY," +
  				"name text UNIQUE NOT NULL," +
  				"owner text NOT NULL",
  accounts: 
  				"name text NOT NULL PRIMARY KEY",
  users: 
  				"id SERIAL PRIMARY KEY," +
  				"fullname text NOT NULL," +
  				"phone text UNIQUE," +
  				"email text UNIQUE",
  alerts: 
  				"id SERIAL PRIMARY KEY," +
  				"group_ref integer",
  monitors_to_groups: 
  				"monitors_ref integer NOT NULL," +
  				"groups_ref integer NOT NULL",
  accounts_to_users: 
  				"accounts_ref text NOT NULL," +
  				"users_ref integer NOT NULL",
  users_to_alerts: 
  				"users_ref integer NOT NULL," +
  				"alerts_ref integer NOT NULL" }

schema.indices = {
}

module.exports = schema;