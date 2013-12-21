#!/bin/bash

for f in ./resources/css/*
do
	NAME=`basename "$f"`
	EXT="${NAME##*.}"
	if [ "$EXT" == "styl" ]; then
		./node_modules/stylus/bin/stylus -u nib $f
	fi
done