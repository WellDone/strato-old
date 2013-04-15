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
                "GSMID     varchar(20) UNIQUE NOT NULL," +
                "SiteID    integer," +
                "CONSTRAINT monitors_sites_fkey FOREIGN KEY (SiteID)" +
                "    REFERENCES sites (ID) MATCH SIMPLE" +
                "    ON UPDATE NO ACTION ON DELETE NO ACTION",

  "aggregate_reports":
                "Date           date NOT NULL," +
                "MonitorID      integer NOT NULL," +
                "Raw            varchar(160)," +
                "BatteryVoltage real," +
                "SensorType     integer," +
                "CurrentHour    integer," +
                "HourCount      integer," +
                "EventCount     integer," +
                "HourlyPulses   integer[24]," +
                //"CONSTRAINT aggregate_reports_pkey PRIMARY KEY (Date, MonitorID)," +
                "CONSTRAINT aggregate_reports_monitors_fkey FOREIGN KEY (MonitorID)" +
                "    REFERENCES monitors (ID) MATCH SIMPLE" +
                "    ON UPDATE NO ACTION ON DELETE NO ACTION"
};

schema.indices = {
  "index_aggregateReportData":   "ON aggregate_reports USING btree (MonitorID, Date)"
}

module.exports = schema;