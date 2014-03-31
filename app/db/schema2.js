var schema = {
  version: 2
};

schema.tables = {

  "DBINFO":     "Version   INTEGER NOT NULL",

  "sites":      "ID        SERIAL PRIMARY KEY," +
                "Name      varchar(256)," +
                "Country   varchar(256)",

  "monitors":   "ID        SERIAL PRIMARY KEY," +
                "Name      varchar(256)," +
                "Location  point," +
                "GSMID     varchar(20) UNIQUE NOT NULL," +
                "SiteID    integer," +
                "CONSTRAINT monitors_sites_fkey FOREIGN KEY (SiteID)" +
                "    REFERENCES sites (ID) MATCH SIMPLE" +
                "    ON UPDATE NO ACTION ON DELETE NO ACTION",

  "groups":     "ID        SERIAL PRIMARY KEY," +
                "Name      varchar(256) UNIQUE NOT NULL," +
                "Owner     INTEGER NOT NULL",

  "monitors_to_groups": 
                "monitors_id integer PRIMARY KEY," +
                "groups_id integer," +
                "CONSTRAINT monitors_to_groups_monitors_fkey FOREIGN KEY (monitors_id)" +
                "    REFERENCES monitors (ID) MATCH SIMPLE" +
                "    ON UPDATE NO ACTION ON DELETE NO ACTION," +
                "CONSTRAINT monitors_to_groups_groups_fkey FOREIGN KEY (groups_id)" +
                "    REFERENCES groups (ID) MATCH SIMPLE" +
                "    ON UPDATE NO ACTION ON DELETE NO ACTION",

  "aggregate_reports":
                "Timestamp      timestamp NOT NULL," +
                "MonitorID      integer NOT NULL," +
                "Raw            varchar(160)," +
                "BatteryVoltage real," +
                "SensorType     integer," +
                "CurrentHour    integer," +
                "HourCount      integer," +
                "EventCount     integer," +
                "HourlyPulses   integer[24]," +
                "created_at     timestamp NOT NULL DEFAULT now()," +
                //"CONSTRAINT aggregate_reports_pkey PRIMARY KEY (Date, MonitorID)," +
                "CONSTRAINT aggregate_reports_monitors_fkey FOREIGN KEY (MonitorID)" +
                "    REFERENCES monitors (ID) MATCH SIMPLE" +
                "    ON UPDATE NO ACTION ON DELETE NO ACTION",

  "malformed_reports":
                "Timestamp        timestamp," +
                "SMSFrom          varchar(20)," +
                "Body             varchar(160)," +
                "created_at       timestamp NOT NULL DEFAULT now()"
};

schema.indices = {
  "index_aggregateReportData":   "ON aggregate_reports USING btree (MonitorID, Timestamp)"
}

module.exports = schema;