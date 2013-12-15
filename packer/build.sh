#!/bin/bash

set -e

#export PACKER_LOG=1
rm packer/virtualbox_virtualbox.box || true
packer build --only=virtualbox packer_config.json
vagrant box remove welldone_server || true
vagrant box add welldone_server packer/virtualbox_virtualbox.box