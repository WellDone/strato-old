#/bin/bash

bash /vagrant/config/setup_appserver.sh
bash /vagrant/config/setup_dbserver.sh
bash /vagrant/config/setup_proxyserver.sh
bash /vagrant/config/init_database.sh
sudo -u application bash '/vagrant/config/start_application.sh'