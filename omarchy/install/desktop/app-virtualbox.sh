#!/bin/bash

# virtualbox-host-dkms builds the modules for linux-omarchy (virtualbox-host-modules-arch only targets stock linux)
green_text "Installing VirtualBox"
omarchy-pkg-add virtualbox virtualbox-host-dkms
