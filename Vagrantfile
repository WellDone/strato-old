# -*- mode: ruby -*-
# vi: set ft=ruby :

# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!
VAGRANTFILE_API_VERSION = "2"

Vagrant.require_version ">= 1.5.0"
Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  config.vm.box = "welldone/strato-base"
  config.vm.box_version = ">=0.1, < 1.0"

  config.ssh.username = "wdadmin"

  config.vm.network "forwarded_port", guest: 80, host: 3000
  config.vm.network "forwarded_port", guest: 443, host: 3001
  config.vm.network "forwarded_port", guest: 5432, host: 5433

  config.vm.provision "shell", inline: "ln -fs /vagrant /welldone"
  config.vm.provision "shell", inline: "/vagrant/deploy.sh -spd local"
end