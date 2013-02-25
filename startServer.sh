#!/bin/sh

# Configure your server with the following variables:
export NODE_DEBUG_MODE=1
export DATABASE_URL=tcp://user:password@localhost:5432/WellDone

# Run the server
node ./server.js