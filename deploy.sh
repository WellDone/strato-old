#!/bin/bash

usage()
{
cat << EOF
usage: $0 [OPTIONS] <TARGET> [[<repo>:]<branch>]

OPTIONS (all optional):
   -h     Show this message
   -p     Run provisioning steps to initialize a new server.
   -s     Delete all existing data, recreate and reseed the database.  USE AT YOUR OWN RISK
   -d     Install the development self-signed SSL certificate

TARGET:
   The target VM, or "vagrant" or "local".  
REPO:
   The git repository to use as the source for the deployment, defaults to https://github.com/welldone/strato.git
BRANCH:
   The git branch to use as the source for the deployment, defaults to master
EOF
}

SSH_CMD=""
GITREPO="https://github.com/welldone/strato.git"
GITBRANCH="master"

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
fi

TARGET="$1"
if [ -n "$2" ]; then
	GIT_ARG="$2"
	GIT_DELIM=`echo $GIT_ARG | sed -n "s/:.*//p" | wc -c`
	
	if [ $GIT_DELIM -ne 0 ]; then
		GITREPO=${GIT_ARG:0:(GIT_DELIM-1)}
	fi
	rem=(GIT_DELIM-${#GIT_ARG})
	GITBRANCH=${GIT_ARG:rem}
fi
echo "REPO:   $GITREPO"
echo "BRANCH: $GITBRANCH"

if [ $TARGET == "vagrant" ]; then
	SSH_CMD="vagrant ssh -c"
elif [ $TARGET == "local" ]; then
	SSH_CMD="bash -c"
else
	SSH_CMD="ssh $TARGET"

	echo "Downloading Git..."
	$SSH_CMD "sudo apt-get update && sudo apt-get install -y git" 2>>deploy.log 1>>deploy.log
	if [ $? -ne 0 ]; then
		echo "Failed!"
		exit 1
	fi
	echo "Downloading Strato from GitHub..."
	$SSH_CMD "sudo mkdir -p /welldone_tmp
	          sudo chmod a+rw /welldone_tmp
	          cd /welldone_tmp
	          git clone $GITREPO
	          cd strato
	          git checkout $GITBRANCH
	          git pull
	          cd app
	          npm update" 2>>deploy.log 1>>deploy.log
	if [ $? -ne 0 ]; then
		echo "Failed!"
		exit 1
	fi
	echo "Backing up existing files..."
	$SSH_CMD "sudo mkdir -p /welldone
	          rm -rf /welldone_backup
	          sudo mv -f /welldone /welldone_backup" 2>>deploy.log 1>>deploy.log
	if [ $? -ne 0 ]; then
		echo "Failed!"
		exit 1
	fi
	echo "Hotswapping..."
	$SSH_CMD "sudo mv -f /welldone_tmp/strato /welldone
            sudo rm -rf /welldone_tmp /welldone_backup" 2>>deploy.log 1>>deploy.log
  if [ $? -ne 0 ]; then
  	echo "Failed!  Restoring..."
		$SSH_CMD "sudo mv -f /welldone_backup /welldone" 2>>deploy.log 1>>deploy.log
		exit 1
	fi

fi

if [ -n "$PROVISION" ]; then
	echo "Provisioning server"
	$SSH_CMD "sudo bash -c 'export APP_CONTEXT=$APP_CONTEXT; /welldone/config/provision.sh'" 2>>deploy.log 1>>deploy.log
fi

echo "Restarting the process..."
$SSH_CMD "set -e
          cd /welldone/app
          sudo service nginx restart
          sudo bash ./control/stop.sh
          chmod +x ./control/initdb.sh
          sudo -u postgres bash -c './control/initdb.sh $CLEAN'
          chmod +x ./control/start.sh
          sudo -u application bash -c 'export DATABASE_URL=tcp://dbadmin:GikmnmJKDOB3@localhost:5432/welldone; ./control/start.sh'" 2>>deploy.log 1>>deploy.log
if [ $? -ne 0 ]; then
	echo "Failed!  Recovering..."
	$SSH_CMD "sudo mv -f /welldone_backup /welldone" 2>>deploy.log 1>>deploy.log
	exit 1
fi

echo "SUCCESS!"