# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0


from prompts.titan_prompts import get_titan_document_prompt
from prompts.claude_prompts import get_claude_document_prompt


def get_prompts(model_id, question, context, chat_history, location, language):
    if model_id == "Amazon-Titan-Express":
        return get_titan_document_prompt(question, context, chat_history, location, language)
    elif model_id == "Anthropic-Claude-V2.1":
        return get_claude_document_prompt(question, context, chat_history, location, language)
    elif model_id == "Anthropic-Claude-Instant":
        return get_claude_document_prompt(question, context, chat_history, location, language)
    else:
        raise NameError("Invalid Model Specified - GetPrompts")