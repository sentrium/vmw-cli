#!/bin/bash

docker run -i -e VMWUSER -e VMWPASS -v ${PWD}:/files apnex/vmw-cli $1 $2 $3
