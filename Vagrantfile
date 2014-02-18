# -*- mode: ruby -*-
# vi: set ft=ruby :

# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!
VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  config.vm.box = "welldone_server"

  config.ssh.username = "wdadmin"

  config.vm.network "forwarded_port", guest: 80, host: 3000

  config.vm.provision "shell", inline: "ln -fs /vagrant /welldone"
  config.vm.provision "shell", inline: "/vagrant/deploy.sh -sp local"
end