#!/bin/bash

VERSION=$(curl -s "https://api.github.com/repos/fullstorydev/grpcurl/releases/latest" | grep -Po '"tag_name": "v\K[^"]*')
curl -sSL "https://github.com/fullstorydev/grpcurl/releases/download/v${VERSION}/grpcurl_${VERSION}_linux_x86_64.tar.gz" | sudo tar -xz -C /usr/local/bin
