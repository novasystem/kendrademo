# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

import os
import boto3

def get_model_args(model_id, prompt):   
    if model_id == "Amazon-Titan-Express":
        
        question_llm_model_args = {
            "inputText": prompt,
            "textGenerationConfig": {
                "temperature": 0.0,  
                "topP": 0.9,
                "maxTokenCount": 1000,
                "stopSequences": []
            }
        }

        qa_llm_model_args = {
            "inputText": prompt,
            "textGenerationConfig": {
                "temperature": 0.0,  
                "topP": 0.9,
                "maxTokenCount": 1500,
                "stopSequences": []
            }
        }
        
    elif model_id == "Anthropic-Claude-V2.1":
        question_llm_model_args = {
            "prompt": prompt,
            "max_tokens_to_sample": 1000, 
            "stop_sequences": [], 
            "temperature": 0.0, 
            "top_p": 0.9 
        }

        qa_llm_model_args = { 
            "prompt": prompt,
            "max_tokens_to_sample": 1500, 
            "stop_sequences": [], 
            "temperature": 0.0, 
            "top_p": 0.9 
        }
    elif model_id == "Anthropic-Claude-Instant":
        question_llm_model_args = {
            "prompt": prompt,
            "max_tokens_to_sample": 1000, 
            "stop_sequences": [], 
            "temperature": 0.0, 
            "top_p": 0.9 
        }

        qa_llm_model_args = { 
            "prompt": prompt,
            "max_tokens_to_sample": 1500, 
            "stop_sequences": [], 
            "temperature": 0.0, 
            "top_p": 0.9 
        }
    else:
        raise NameError("Invalid Model Specified")
    
    return question_llm_model_args, qa_llm_model_args


def get_model_id(model_id):
    if model_id == "Amazon-Titan-Express":
        return "amazon.titan-text-express-v1"
    elif model_id == "Anthropic-Claude-V2.1":
        return "anthropic.claude-v2:1"
    elif model_id == "Anthropic-Claude-Instant":
        return "anthropic.claude-instant-v1"
    else:
        raise NameError("Invalid Model Specified")


def get_bedrock_client():
    bedrock_session = boto3.Session(
            aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
            aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
            aws_session_token=os.getenv('AWS_SESSION_TOKEN')
        )
    return bedrock_session.client(service_name="bedrock-runtime", region=os.environ['AWS_REGION'])