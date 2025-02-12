#!/bin/bash 
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

USER_POOL_ID=$1
USER_NAME=$2
GROUP_NAME=$3

set -e
echo "Adding user ${USER_NAME} in ${USER_POOL_ID} to group ${GROUP_NAME}..."

aws cognito-idp admin-add-user-to-group --user-pool-id "${USER_POOL_ID}" --username "${USER_NAME}" --group-name "${GROUP_NAME}"

echo "User ${USER_NAME} added to group ${GROUP_NAME}"