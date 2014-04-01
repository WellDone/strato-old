echo "Starting application..."

cd /welldone/app

export DATABASE_URL=postgres://dbadmin:GikmnmJKDOB3@localhost:5432/welldone
export NODE_DEBUG=1

export PORT=10000
mkdir -p /home/application/api
nohup node api.js 1>>/home/application/api/out.log 2>>/home/application/api/err.log &
echo $! > /home/application/api/pid
echo API PID: $!

export PORT=11000
export DATABASE_URL=postgres://dbadmin:GikmnmJKDOB3@localhost:5432/welldone
export NODE_DEBUG=1
mkdir -p /home/application/gateway
nohup node gateway.js 1>>/home/application/gateway/out.log 2>>/home/application/gateway/err.log &
echo $! > /home/application/gateway/pid
echo Gateway PID: $!