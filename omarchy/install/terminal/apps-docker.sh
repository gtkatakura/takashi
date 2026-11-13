#!/bin/bash

# Start Docker at boot. Omarchy only enables docker.socket, so containers with a restart policy
# (docker-hostmanager, the token-cost telemetry stack) stay down until something calls docker.
sudo systemctl enable --now docker

# Create docker-hostmanager container if it doesn't exist
if ! sudo docker ps -a --format '{{.Names}}' | grep -q "^docker-hostmanager$"; then
  sudo docker run -d \
    --name docker-hostmanager \
    --restart=always \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v /etc/hosts:/hosts \
    iamluc/docker-hostmanager
fi
