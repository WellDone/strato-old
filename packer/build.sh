#!/bin/bash

usage()
{
cat << EOF
usage: $0 [options] <builder>

Builds a WellDone MoMo Server basebox using Packer.
<builder>:
   virtualbox
   digitalocean
   amazon-ebs (untested)

OPTIONS (all optional):
   -h      Show this message
   -k      Specify the location of the SSH public key file to install
   -v      Set to "true" to allow SSH using the insecure Vagrant public key
   -p      Set the admin user password, default "KwRirc0YC1Ob"
   -d      Enable packer debug logging

AWS_ACCESS_KEY and AWS_SECRET_KEY environment variables are required for
  the amazon-ebs builder
DIGITALOCEAN_CLIENT_ID and DIGITALOCEAN_API_KEY environment variables are
  required for the digitalocean builder
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
		PACKER_OPTIONS="$PACKER_OPTIONS -var 'ssh_pass=$OPTARG'"
		;;
	d)
		DEBUG=1
		;;
		
	?)
		usage
		exit 1
		;;
	esac
done

shift $(($OPTIND - 1))

BUILDER=$1
case "$BUILDER" in
	virtualbox)
		VAGRANT_BOX_FILE="./packer_virtualbox_virtualbox.box"
		;;
	digitalocean)
		VAGRANT_BOX_FILE="./packer_digitalocean_digitalocean.box"
		;;
	amazon-ebs)
		VAGRANT_BOX_FILE="./packer_amazon-ebs_aws.box"
		;;
	*)
		echo "ERROR: Invalid builder specified."
		usage
		exit 1
		;;
esac

if [ -n "$AWS_ACCESS_KEY" ]; then
	PACKER_OPTIONS="$PACKER_OPTIONS -var 'aws_access_key=$AWS_ACCESS_KEY'"
fi
if [ -n "$AWS_SECRET_KEY" ]; then
	PACKER_OPTIONS="$PACKER_OPTIONS -var 'aws_secret_key=$AWS_SECRET_KEY'"
fi


set -e
if [ $DEBUG -eq 1 ]; then
	export PACKER_LOG=1
fi

if [ -e "$PUBKEY" ]; then
	PUBKEYFILE=`basename "$PUBKEY"`
	echo "Trusting pulic key '$PUBKEYFILE'"
	PUBKEYTARGET="./ssh_keys/$PUBKEYFILE"

	if [ -e $PUBKEYTARGET ]; then
		echo "ERROR: '$PUBKEYFILE' already exists in the ssh_keys directory."
		exit 1
	fi
	cp "$PUBKEY" "$PUBKEYTARGET"
else
	if [ -n "$PUBKEY" ]; then
		echo "ERROR: SSH Public key file does not exist."
		exit 1
	fi
fi

if [ -e "$VAGRANT_BOX_FILE" ]; then
	rm $VAGRANT_BOX_FILE || true
fi
echo "packer build --only=$BUILDER server_config.json $PACKER_OPTIONS" | sh
if [ -n "$PUBKEYTARGET" ]; then
	echo "Cleaning up public key file."
	rm -f "$PUBKEYTARGET"
fi

vagrant box remove welldone_server || true
vagrant box add welldone_server $VAGRANT_BOX_FILE