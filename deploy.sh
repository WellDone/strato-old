#!/bin/bash

usage()
{
cat << EOF
usage: $0 [OPTIONS] <TARGET>

OPTIONS (all optional):
   -h     Show this message
   -p     Run provisioning steps to initialize a new server.
   -s     Delete all existing data, recreate and reseed the database.  USE AT YOUR OWN RISK
   -d     Install the development self-signed SSL certificate

TARGET:
   The target VM, or "vagrant" or "local".  
EOF
}

SSH_CMD=""
TARGET_MACHINE=""

CLEAN=
PROVISION=
APP_CONTEXT="PRODUCTION"

while getopts "hspd" OPTION
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
	d)
		APP_CONTEXT="DEVELOPMENT"
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

	echo "Downloading Git..."
	$SSH_CMD "sudo apt-get install -y git" 2>1 >> deploy.log
	if [ $? -ne 0 ]; then
		echo "Failed!"
		exit 1
	fi
	echo "Downloading Strato from GitHub..."
	$SSH_CMD "sudo mkdir -p /welldone_tmp
	          sudo chmod a+rw /welldone_tmp
	          cd /welldone_tmp
	          git clone https://github.com/welldone/strato.git
	          cd strato
	          git checkout master
	          git pull
	          cd app
	          npm update" 2>1 >> deploy.log
	if [ $? -ne 0 ]; then
		echo "Failed!"
		exit 1
	fi
	echo "Backing up existing files..."
	$SSH_CMD "sudo mkdir -p /welldone
	          rm -rf /welldone_backup
	          sudo mv -f /welldone /welldone_backup" 2>1 >> deploy.log
	if [ $? -ne 0 ]; then
		echo "Failed!"
		exit 1
	fi
	echo "Hotswapping..."
	$SSH_CMD "sudo mv -f /welldone_tmp/strato /welldone
            sudo rm -rf /welldone_tmp /welldone_backup" 2>1 >> deploy.log
  if [ $? -ne 0 ]; then
  	echo "Failed!  Restoring..."
		$SSH_CMD "sudo mv -f /welldone_backup /welldone" 2>1 >> deploy.log
		exit 1
	fi

fi

if [ -n "$PROVISION" ]; then
	echo "Provisioning server"
	$SSH_CMD "sudo bash -c 'export APP_CONTEXT=$APP_CONTEXT; /welldone/config/provision.sh'" 2>1 >> deploy.log
fi

echo "Restarting the process..."
$SSH_CMD "set -e
          cd /welldone/app
          sudo service nginx restart
          sudo bash ./control/stop.sh
          chmod +x ./control/initdb.sh
          sudo -u postgres bash -c './control/initdb.sh $CLEAN'
          chmod +x ./control/start.sh
          sudo -u application bash -c 'export DATABASE_URL=tcp://dbadmin:GikmnmJKDOB3@localhost:5432/welldone; ./control/start.sh'" 2>1 >> deploy.log
if [ $? -ne 0 ]; then
	echo "Failed!  Recovering..."
	$SSH_CMD "sudo mv -f /welldone_backup /welldone" 2>1 >> deploy.log
	exit 1
fi

echo "SUCCESS!"