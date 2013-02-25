var schema = {
  version: 1
};

schema.tables = {

  "DBINFO":     "Version   INTEGER NOT NULL",

  "sites":      "ID        SERIAL PRIMARY KEY," +
                "Name      varchar(256)," +
                "Country   varchar(256)",

  "monitors":   "ID        SERIAL PRIMARY KEY," +
                "Name      varchar(256)," +
                "Location  point," +
                "GSM_ID    integer UNIQUE NOT NULL," +
                "SiteID    integer," +
                "CONSTRAINT monitors_sites_fkey FOREIGN KEY (SiteID)" +
                "    REFERENCES sites (ID) MATCH SIMPLE" +
                "    ON UPDATE NO ACTION ON DELETE NO ACTION",

  "reports":    "Date      date NOT NULL," +
                "Volume    integer NOT NULL," +
                "MonitorID integer NOT NULL," +
                "CONSTRAINT reports_pkey PRIMARY KEY (Date, MonitorID)," +
                "CONSTRAINT reports_monitors_fkey FOREIGN KEY (MonitorID)" +
                "    REFERENCES monitors (ID) MATCH SIMPLE" +
                "    ON UPDATE NO ACTION ON DELETE NO ACTION"
};

schema.indices = {
  "index_reportData":   "ON reports USING btree (Date)"
}

module.exports = schema;