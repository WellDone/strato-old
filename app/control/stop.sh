#!/bin/bash

if [ -e /home/application/api/pid ]; then
	PID=`cat /home/application/api/pid`
	kill $PID && echo "killed API application with PID $PID"
	rm /home/application/api/pid
else
	echo "No API pplication currently running."
fi

set -e
if [ -e /home/application/gateway/pid ]; then
	PID=`cat /home/application/gateway/pid`
	kill $PID && echo "killed Gateway application with PID $PID"
	rm /home/application/gateway/pid
else
	echo "No Gateway pplication currently running."
fi