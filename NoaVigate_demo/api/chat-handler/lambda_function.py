"""
Copyright 2023 Amazon.com, Inc. and its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License").
You may not use this file except in compliance with the License.
A copy of the License is located at

  http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed
on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
express or implied. See the License for the specific language governing
permissions and limitations under the License.
"""

import json
import uuid
import os
import boto3
from prompts_factory import get_prompts
from llm_factory import get_model_id, get_model_args
from botocore.config import Config
import urllib.parse
import datetime



config = Config(connect_timeout=5, read_timeout=60, retries={"total_max_attempts": 20, "mode": "adaptive"})

CHAT_MESSAGE_HISTORY_TABLE_NAME = os.environ["CHAT_MESSAGE_HISTORY_TABLE_NAME"]
AWS_INTERNAL = os.environ["AWS_INTERNAL"]

s3_client = boto3.client('s3')
ddb_client = boto3.resource("dynamodb")
session_table = ddb_client.Table(CHAT_MESSAGE_HISTORY_TABLE_NAME)
MAX_HISTORY_LENGTH = 10
BOT_NAME="Guru"

region = "eu-central-1"
kendra_index_id = os.environ["KENDRA_INDEX_ID"]
NO_OF_PASSAGES_PER_PAGE = os.environ["NO_OF_PASSAGES_PER_PAGE"]
NO_OF_SOURCES_TO_LIST = os.environ["NO_OF_SOURCES_TO_LIST"]

bedrock = boto3.client(
                service_name='bedrock-runtime',
                region_name=region,
                endpoint_url=f'https://bedrock-runtime.{region}.amazonaws.com',
                                    config=config)


kendra_client = boto3.client("kendra")

def get_context(question, jwt_token):
   
    kargs = {
        "IndexId": kendra_index_id,
        "QueryText": question.strip(),
        "PageSize": int(NO_OF_PASSAGES_PER_PAGE),
        "UserContext": {
            'Token':jwt_token
                },
        "AttributeFilter": {
            "EqualsTo": {      
                "Key": "_language_code",
                "Value": {
                    "StringValue": "es"
                    }
                }
            }
    }
    return kendra_client.retrieve(**kargs)

def lambda_handler(event, context):
    conversation_id = None  # Initialize conversation_id

    try:
        # ConversationId is the SessionId
        body = event.get("body", "{}")
        body = json.loads(body)
        print("api call:", body)
        
        model_id = body.get("model_id")
        modelId = get_model_id(model_id)
        #print("Model:", model_id, "Type:", type(model_id))

        
        conversation_id = body.get("conversationId")
        jwt_token = body.get("token")
        location = body.get("location")
        language = body.get("language")
        print("Location:", location, "Language:", language)

        
        # If frontend does not pass a conversationId, create a new one
        if not conversation_id:
            # This is the start of a new conversation
            conversation_id = uuid.uuid4().hex
        
        #fetch chat history
        chat_history = get_chat_history(conversation_id)
        print("Chat History: ", chat_history)

        # Run question through chain
        question = body["question"].strip().replace("?","")
        

        # Fetch Kendra Semantic Search results
        relevant_documents = get_context(question, jwt_token)
        source_page_info = get_relevant_doc_names(relevant_documents, language)
        
        document_prompt = get_prompts(model_id, question, relevant_documents, chat_history, location, language)
        question_llm_model_args, document_llm_model_args = get_model_args(model_id, document_prompt)
        
        body = json.dumps(document_llm_model_args)
        
        accept = "*/*"
        contentType = "application/json"

        content = bedrock.invoke_model(
            body=body, modelId=modelId, accept=accept, contentType=contentType
        )
        response = json.loads(content.get("body").read())
        
        answer = get_llm_answer(model_id, response)

        
        # Get the current time in a human-readable format
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        #Add item to table
        new_item = {
            'Timestamp': timestamp,
            'SessionId': conversation_id,
            'modelId': modelId,
            'Question': question,
            'Response': answer,
        }

        session_table.put_item(Item=new_item)


        body = {
            "source_page": source_page_info if should_source_be_included(answer) else [],
            "answer": answer,
            "conversationId": conversation_id
        }
        

        return {
            "statusCode": 200,
            "headers": {
                "Cache-Control": "no-cache, no-store",
                "Content-Type": "application/json"
            },
            "body": json.dumps(body),
            "isBase64Encoded": False
        }
    except Exception as e:
        print(e)
        return {
            "statusCode": 500,
            "headers": {
                "Cache-Control": "no-cache, no-store",
                "Content-Type": "application/json"
            },
            "body": json.dumps( {
                "source_page": [],
                "answer": "Hmm, I ran into errors. Please re-try.",
                "conversationId": conversation_id
            }),
            "isBase64Encoded": False
        }
        
def get_llm_answer(model_id, response):
    if model_id == "Ammazon-Titan-Express":
        return response.get('results')[0].get('outputText')
    elif model_id == "Anthropic-Claude-V2.1":
        return response.get("completion")
    elif model_id == "Anthropic-Claude-Instant":
        return response.get("completion")
    

def should_source_be_included(ans):
    
    include = True
    if ans:
        answer = ans.lower()
        words_with_no_source = ["unfortunately", "i do not have", "i'm sorry", "i do not see", "i did not find", "avoid profanity"]
        
        for substring in words_with_no_source:
            if substring in answer:
                include = False
                break
    else:
        return False
        
    return include

def get_relevant_doc_names(relevant_documents, language):
    sources = []
    doc_names = []
    
    if 'ResultItems' in relevant_documents:
        for doc in relevant_documents['ResultItems']:
            sources.append(doc["DocumentId"])
    
    if sources:
        source_groups_weight_dict = get_doc_uri(sources)
        print(f"source_groups_weight_dict={source_groups_weight_dict}")
        most_relevant_docs = sorted(source_groups_weight_dict, key=source_groups_weight_dict.get, reverse=True)
        print(f"most_relevant_docs={most_relevant_docs}")
        # Restrict the sources being listed based on Env Value
        most_relevant_docs = most_relevant_docs[:int(NO_OF_SOURCES_TO_LIST)]
        for doc_path in most_relevant_docs:
            doc_names.append( { "file_name": get_source_file_name(doc_path), "file": get_presigned_url(doc_path, language) })

    return doc_names

def get_source_file_name(source):
    parts = source.split("/")
    return parts[len(parts)-1:][0]

def get_doc_uri(sources):
    res = {}
    for source in sources:
        if source not in res:
            res[source] = 1
        else:
            res[source] += 1
    return res

def get_presigned_url(s3_file_path, language):
    parts = s3_file_path.split("/")
    bucket = parts[2]
    if language == "Spanish":
        key = '/'.join(parts[3:])
    else:
        key = 'private/' + language + '/' + '/'.join(parts[4:])

    s3 = boto3.client('s3', config=Config(s3={'addressing_style': 'virtual'}))
    response = s3.generate_presigned_url(
        ClientMethod='get_object',
        Params={
            'Bucket': bucket,
            'Key': key
        },
        ExpiresIn=30000
    )
    return response
        
def get_chat_history(session_id):
    response = session_table.query(
        KeyConditionExpression=boto3.dynamodb.conditions.Key('SessionId').eq(session_id),
        ScanIndexForward=False,  # False to sort by Timestamp in descending order
        Limit=5,  # Fetch only the 5 most recent items
        ProjectionExpression="#Q, #R",  # Use placeholders for actual attribute names
        ExpressionAttributeNames={
            "#Q": "Question",  # Placeholder for 'Question'
            "#R": "Response"   # Placeholder for 'Response' (reserved keyword)
        }
    )
    history = []
    for item in response.get('Items', []):
        # Format the question-answer pair
        qa_pair = f"Q: {item['Question']} A: {item['Response']}"
        history.append(qa_pair)
    return history[::-1]  # Reverse to get the history in chronological order
