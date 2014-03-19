echo "Starting application..."

cd /welldone/app
export PORT=10000
export DATABASE_URL=postgres://dbadmin:GikmnmJKDOB3@localhost:5432/welldone
export NODE_DEBUG=1
nohup node api.js 1>>/home/application/out.log 2>>/home/application/err.log &
echo $! > /home/application/pid
echo PID: $!

#PORT=20000
#forever start -p /var/log/welldone_server/portal/.forever /vagrant/app/portal.js

#PORT=30000
#forever start -p /var/log/welldone_server/api/.forever /vagrant/app/api.js