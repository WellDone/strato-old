#!/bin/bash

usage()
{
cat << EOF
usage: $0 [OPTIONS] <TARGET>

OPTIONS (all optional):
   -h     Show this message
   -p     Run provisioning steps to initialize a new server.
   -s     Delete all existing data, recreate and reseed the database.  USE AT YOUR OWN RISK

TARGET:
   The target VM, or "vagrant" or "local".  
EOF
}

SSH_CMD=""
TARGET_MACHINE=""

CLEAN=
PROVISION=

while getopts "hsp" OPTION
do
	case $OPTION in
	h)
		usage
		exit 1
		;;
	s)
		CLEAN=true
		;;
	p)
		PROVISION=true
		;;
	?)
		usage
		exit 1
		;;
	esac
done

shift $(($OPTIND - 1))

if [ -z "$1" ]; then	usage
	exit 1
elif [ "$1" == "vagrant" ]; then
	TARGET_MACHINE=""
	SSH_CMD="vagrant ssh -c"
elif [ "$1" == "local" ]; then
	TARGET_MACHINE="localhost"
	SSH_CMD="bash -c"
else
	TARGET_MACHINE="$1"
	SSH_CMD="ssh $TARGET_MACHINE"
	$SSH_CMD "sudo mkdir -p /welldone/tmp"

	tar -cz ./app | $SSH_CMD "sudo tar -xzC /welldone/tmp"
	tar -cz ./config | $SSH_CMD "sudo tar -xzC /welldone/tmp"

	echo "Synchronizing ./app and ./config..."
	$SSH_CMD "cd /welldone
	          rm -rf ./backup
	          sudo mkdir backup
	          if [ -e ./app ]; then sudo mv -f ./app ./backup/app; fi
            if [ -e ./config ]; then sudo mv -f ./config ./backup/config; fi
            sudo mv -f ./tmp/* ./
            sudo rm -rf ./tmp ./backup"
fi

if [ -n "$PROVISION" ]; then
	echo "Provisioning server"
	$SSH_CMD "sudo bash /welldone/config/provision.sh"
fi

$SSH_CMD "cd /welldone/app
          sudo bash ./control/stop.sh
          chmod +x ./control/initdb.sh
          sudo -u postgres bash -c './control/initdb.sh $CLEAN'
          chmod +x ./control/start.sh
          sudo -u application bash -c 'export DATABASE_URL=tcp://dbadmin:GikmnmJKDOB3@localhost:5432/welldone; ./control/start.sh'"