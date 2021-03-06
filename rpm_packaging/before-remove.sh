# shut down service
systemctl stop goldstone-server
systemctl disable goldstone-server

# remove stopped containers
echo "Removing containers..."
if [ `docker ps -a | grep goldstone | wc -l` -gt 0 ]; then
  docker rm -f $(docker ps -a | grep goldstone | awk '{print $1}' | xargs) || /bin/true
fi
echo "Removing images..."
if [ `docker images -a | grep goldstone | wc -l` -gt 0 ]; then
  docker rmi -f $(docker images | grep goldstone | awk '{print $3}' | xargs) || /bin/true
fi
