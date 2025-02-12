#!/bin/bash
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

set -o pipefail # FAIL FAST
shopt -s expand_aliases

export STACK_NAME="guru-kendra-chatbot"

# Tutorial: Deployment scrips can be very complicated or very simple. Depending on your flow.
## It is recommended you try to keep all deployment of resources contained in CDK if possible
## There are exceptions to this such as training jobs or seeding data.
echo "******************"
echo ""
echo "Tool Versions:"
echo "Python version: $(python3 --version)"
echo "Node version: $(node --version)" 
echo "NPM version: $(npm --version)"
echo ""
echo "******************"

chmod +x create-layer.sh
source ./create-layer.sh

touch ./web-app/.env

# Run build
npm run build

npm run deploy.bootstrap
npm run deploy

# When Deployment is done lets get the Kenda Input Bucket name from the Outputs and Update the env file
KENDRA_DATA_SYNC_BUCKET=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?contains(OutputKey, 'KendraDataSyncS3Bucket')].OutputValue" --output text)
echo "REACT_APP_UPLOAD_S3_BUCKET=${KENDRA_DATA_SYNC_BUCKET}" >> ./web-app/.env

# lets run a deployment again for the .env file change to be repackaged and deployed
npm run build
npm run deploy

################## Initial folders and documents deployment

# Lets also fill the bucket with the required docs
aws s3 cp ./assets/S3_folders s3://$KENDRA_DATA_SYNC_BUCKET --recursive

# Lets also fill the DynamoDB table with the info of the newly added files

# Get DynamoDB table name from stack outputs
DYNAMODB_DOCUMENTS_ARTIFACT_TABLE=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='DocumentsArtifactsTableName'].OutputValue" --output text)

# Vector with autonomous community names
regions=(
    "Espana"
    "Andalucia"
    "Aragon"
    "Canarias"
    "Cantabria"
    "CastillaLaMancha"
    "CastillaYLeon"
    "Cataluna"
    "Ceuta"
    "ComunidadDeMadrid"
    "ComunidadValenciana"
    "Extremadura"
    "Galicia"
    "IslasBaleares"
    "LaRioja"
    "Melilla"
    "Navarra"
    "PaisVasco"
    "PrincipadoDeAsturias"
    "RegionDeMurcia"
)

# Loop through each autonomous community and insert into DynamoDB using AWS CLI
for region in "${regions[@]}"; do
    created_on="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
    aws dynamodb put-item \
        --table-name "$DYNAMODB_DOCUMENTS_ARTIFACT_TABLE" \
        --item "{\"DocId\": {\"S\": \".pdf\"}, \"CreatedOn\": {\"S\": \"$created_on\"}, \"KeyPrefix\": {\"S\": \"/public/$region\"}}"
    sleep 1
done


echo "Deployment complete."
