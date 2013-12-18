#!/bin/bash

usage()
{
cat << EOF
Builds a WellDone MoMo Server basebox using Packer.
usage: $0 options

OPTIONS (all optional):
   -h      Show this message
   -k      Specify the location of the SSH public key file to install
   -v      Set to "false" to disable the insecure Vagrant SSH public key
   -p      (unsupported) Set the admin user password, default "wdadminpass"
   -d      Enable packer debug logging
EOF
}

PUBKEY=
VAGRANT="true"
DEBUG=0
PACKER_OPTIONS=""

while getopts “hk:v:p:d” OPTION
do
	case $OPTION in
	h)
		usage
		exit 1
		;;
	k)
		PUBKEY=$OPTARG
		;;
	v)
		PACKER_OPTIONS="$PACKER_OPTIONS -var 'allow_vagrant_pubkey=$OPTARG'"
		;;
	p)
		echo "Options -p is currently unsupported"
		exit 1
		;;
	d)
		DEBUG=1
		;;
	?)
		usage
		exit
		;;
	esac
done

# Useless for VirtualBox
#if [ -n "$AWS_ACCESS_KEY" ]; then
#	PACKER_OPTIONS="$PACKER_OPTIONS -var 'aws_access_key=$AWS_ACCESS_KEY'"
#fi
#if [ -n "$AWS_SECRET_KEY" ]; then
#	PACKER_OPTIONS="$PACKER_OPTIONS -var 'aws_secret_key=$AWS_SECRET_KEY'"
#fi

set -e
if [ $DEBUG -eq 1 ]; then
	export PACKER_LOG=1
fi

if [ -e "$PUBKEY" ]; then
	cp $PUBKEY ./ssh_keys
fi

if [ -e packer_virtualbox_virtualbox.box ]; then
	rm packer_virtualbox_virtualbox.box || true
fi
echo "packer build --only=virtualbox server_config.json $PACKER_OPTIONS" | sh
vagrant box remove welldone_server || true
vagrant box add welldone_server ./packer_virtualbox_virtualbox.box