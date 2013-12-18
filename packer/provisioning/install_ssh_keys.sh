#!/bin/bash

# Install vagrant key
echo Authorizing \"trusted\" SSH keys
mkdir -pm 700 /home/wdadmin/.ssh

AUTHORIZED_KEYS=/home/wdadmin/.ssh/authorized_keys
touch $AUTHORIZED_KEYS
for f in /tmp/ssh_keys/*
do
	NAME=`basename "$f"`
	if [ "$NAME" == "vagrant.pub" ] && [ "$ALLOW_VAGRANT_PUBKEY" != "true" ]; then
		continue
	fi
	echo "Authorized SSH public key $NAME"
	echo "## $NAME ##" >> $AUTHORIZED_KEYS
	cat $f >> $AUTHORIZED_KEYS
done

chmod 0600 /home/wdadmin/.ssh/authorized_keys
chown -R wdadmin:wdadmin /home/wdadmin/.ssh

rm -rf /tmp/ssh_keys
