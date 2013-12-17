# NOT SECURE WITHOUT COMMAND LINE ARGUMENTS!!


# Set up sudo
echo 'wdadmin ALL=NOPASSWD:ALL' > /etc/sudoers.d/wdadmin

# Install vagrant key
echo 'Authorizing "trusted" SSH keys'
mkdir -pm 700 /home/wdadmin/.ssh

AUTHORIZED_KEYS=/home/wdadmin/.ssh/authorized_keys
touch $AUTHORIZED_KEYS
for f in /tmp/ssh_keys/*
do
	if [[ "$f" == "vagrant.pub" ] && [ "$ALLOW_VAGRANT_PUBKEY" != "true" ] ]; then
		continue
	fi
	echo "Authorized SSH public key $f"
	echo "## $f ##" >> $AUTHORIZED_KEYS
	cat $f >> $AUTHORIZED_KEYS
done
rm -rf /tmp/ssh_keys
chmod 0600 /home/wdadmin/.ssh/authorized_keys
chown -R wdadmin:wdadmin /home/wdadmin/.ssh

