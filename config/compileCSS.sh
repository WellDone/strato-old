#!/bin/bash

for f in /welldone/app/resources/css/*
do
	NAME=`basename "$f"`
	EXT="${NAME##*.}"
	if [ "$EXT" == "styl" ]; then
		/welldone/app/node_modules/stylus/bin/stylus -u nib $f
	fi
done