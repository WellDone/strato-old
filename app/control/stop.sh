#!/bin/bash

set -e
if [ -e /home/application/pid ]; then
	PID=`cat /home/application/pid`
	kill $PID
	rm /home/application/pid
	echo "killed application with PID $PID"
else
	echo "No application currently running."
fi