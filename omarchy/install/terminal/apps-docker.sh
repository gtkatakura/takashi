#!/bin/bash

# Create docker-hostmanager container if it doesn't exist
if ! sudo docker ps -a --format '{{.Names}}' | grep -q "^docker-hostmanager$"; then
  sudo docker run -d \
    --name docker-hostmanager \
    --restart=always \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v /etc/hosts:/hosts \
    iamluc/docker-hostmanager
fi
