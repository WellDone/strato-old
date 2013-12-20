# -*- mode: ruby -*-
# vi: set ft=ruby :

# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!
VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  config.vm.box = "welldone_server"

  config.ssh.username = "wdadmin"

  config.vm.network "forwarded_port", guest: 80, host: 3000

  config.vm.provision "shell", path: "config/setup_appserver.sh"
  config.vm.provision "shell", path: "config/setup_dbserver.sh"
  config.vm.provision "shell", path: "config/setup_proxyserver.sh"
  config.vm.provision "shell", inline: "sudo -u dbadmin bash '/vagrant/config/init_database.sh'"
  config.vm.provision "shell", inline: "sudo -u application bash '/vagrant/config/start_application.sh'"
end