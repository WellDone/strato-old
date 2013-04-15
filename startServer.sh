#!/bin/sh

# Configure your server with the following variables:
if [ "$1" = "-d" ]
then
  export NODE_DEBUG_MODE=1
fi

export DATABASE_URL=tcp://user:password@localhost:5432/WellDone
export TWILIO_ACCOUNT_SID=
export TWILIO_AUTH_TOKEN=
export TWILIO_NUMBER=

# Run the server
node ./server.js
