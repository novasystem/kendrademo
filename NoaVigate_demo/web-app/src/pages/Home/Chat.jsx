/**
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0
*/

import { useState, useEffect, useRef } from "react";
import * as React from "react";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import { Avatar, MessageCustomContent } from "@chatscope/chat-ui-kit-react";
import { stripHtml } from "string-strip-html";
import { useCollection } from "@cloudscape-design/collection-hooks";
import {
  setResetChatFunction,
  setResetDocumentFunction,
  setResetModelFunction,
  setCallback,
  setCallbackOne,
  setCallbackTwo,
} from "./chatUtils";
import ExpandableSection from "@cloudscape-design/components/expandable-section";
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  TypingIndicator,
} from "@chatscope/chat-ui-kit-react";
import { Amplify, API, Auth, Storage } from "aws-amplify";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Icon from "@cloudscape-design/components/icon";
import ThumbUpAltIcon from "@material-ui/icons/ThumbUpAlt";
import ThumbDownAltIcon from "@material-ui/icons/ThumbDownAlt";
import Link from "@cloudscape-design/components/link";

import { Tooltip, Typography, CircularProgress } from "@material-ui/core";

let lastLanguage = "English";

export function Chat() {
  const ref = useRef(null);
  const [isThinking, setIsThinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState("");
  const [modelId, setModelId] = useState("Anthropic-Claude-Instant");
  const [userGroup, setUserGroup] = useState("Spain");

  const [messages, setMessages] = useState([
    {
      message: "Hi there! I'm Noa from from Save the Children, here to assist you. Feel free to share a bit about yourself, and I can recommend government benefits you might be entitled to. \
              \n\nFor example, you could say 'I lost my job and have two young kids' and I will propose you some benefits that might help you.",
      sentTime: "now",
      sender: "STC Bot",
      sources: [],
      pages: [],
    },
  ]);

  function removeTags(text) {
    const strippedText = stripHtml(text).result;
    return strippedText;
  }

  useEffect(() => {
    setResetModelFunction(resetModel);
    return () => {
      setResetModelFunction(null);
    };
  }, []);
  
  useEffect(() => {
    setResetChatFunction(resetChat);
    return () => {
      setResetChatFunction(null);
    };
  }, []);

  function resetModel(value) {
    console.log(value);
    if (value === "Anthropic Claude Instant") {
      setModelId("Anthropic-Claude-Instant");
    } else if (value === "Anthropic Claude V2.1") {
      setModelId("Anthropic-Claude-V2.1");
    } else if (value === "Amazon Titan Express") {
      setModelId("Amazon-Titan-Express");
    }
  }
  
  async function getUserGroup() { 
    try { 
        let currentUser = await Auth.currentAuthenticatedUser(); 
        let userGroups = currentUser.signInUserSession.accessToken.payload["cognito:groups"];
        if (userGroups[0] ==! "Admin"){
          setUserGroup(userGroups[0]);
        }
        console.log (userGroups[0]);
    } catch (error) { 
        console.log("error getting current user: ", error); 
    } 
  }
  
  useEffect(() => {
    getUserGroup();
  });

  function resetChat(language) {
      let message;
      
      // Check if language is undefined, to maintain the previous language
      if (language === undefined) {
        console.log(language)
        language = lastLanguage
        console.log(language)
      }
      
      switch (language) {
          case "Spanish":
              message = "¡Hola! Soy el chatbot de Save the Children, estoy aquí para ayudarte. Cuéntame un poco sobre ti para recomendarte beneficios del gobierno a los que podrías acceder. \
              \n\nPor ejemplo, podrías decir 'Perdí mi trabajo y tengo dos hijos pequeños' y te propondré algunos beneficios que podrían ayudarte.";
              break;
          case "English":
              message = "Hi there! I'm Noa from from Save the Children, here to assist you. Feel free to share a bit about yourself, and I can recommend government benefits you might be entitled to. \
              \n\nFor example, you could say 'I lost my job and have two young kids' and I will propose you some benefits that might help you.";
              break;
          case "French":
              message = "Salut! En tant que chatbot de Save the Children, je suis là pour vous assister. N'hésitez pas à partager un peu sur vous-même, et je peux vous recommander des prestations gouvernementales auxquelles vous pourriez avoir droit. \
              \n\nPar exemple, vous pourriez dire 'J'ai perdu mon emploi et j'ai deux jeunes enfants', et je vous proposerai des avantages qui pourraient vous aider.";
              break;
          case "Portuguese":
              message = "Olá! Eu sou o chatbot do Save the Children, aqui para ajudar. Sinta-se à vontade para compartilhar um pouco sobre você, e posso recomendar benefícios do governo aos quais você pode ter direito. \
              \n\nPor exemplo, você poderia dizer 'Perdi meu emprego e tenho dois filhos pequenos', e eu vou propor alguns benefícios que podem ajudá-lo.";
              break;
          case "Arabic":
              message = "مرحبًا! أنا نوا من إنقاذ الطفولة، هنا لمساعدتك. لا تتردد في مشاركة بعض المعلومات عن نفسك، ويمكنني أن أوصيك بالفوائد الحكومية التي قد تكون مؤهلًا لها.\n\nعلى سبيل المثال، يمكنك القول 'لقد فقدت وظيفتي ولدي اثنين من الأطفال الصغار'، وسأقترح عليك بعض الفوائد التي قد تساعدك."
              break;
          default:
              // Default to English if the language is not recognized
              message = "Hi there! I'm Noa from from Save the Children, here to assist you. Feel free to share a bit about yourself, and I can recommend government benefits you might be entitled to. \
              \n\nFor example, you could say 'I lost my job and have two young kids' and I will propose you some benefits that might help you.";
      }
      
      // Update lastLanguage with the current language
      lastLanguage = language;

      setMessages([
        {
          message: message,
          sentTime: "now",
          sender: "STC Bot",
          sources: [],
          pages: [],
        },
      ]);
          
      // Reset other states
      setConversationId("");
      setIsThinking(false);
      setIsTyping(false);
  }

  useEffect(() => {
    setCallbackOne((value) => {
      console.log(value);
      resetModel(value);
    });
  }, [resetModel]);
  
  useEffect(() => {
    setCallbackTwo((language) => {
      console.log(language);
      resetChat(language);
    });
  }, [resetChat]);

  const handleSend = async (message) => {
    message = removeTags(message);
    const newMessage = {
      message,
      direction: "outgoing",
      sender: "User",
      source_page: {},
    };
    const newMessages = [...messages, newMessage];
    setMessages(newMessages);
    setIsThinking(true);
    setIsTyping(true);
    await processMessageToChat(newMessages);
  };

  useEffect(() => {
    if (!isThinking && window.responseCompleteCallback) {
      window.responseCompleteCallback();
    }
  }, [isThinking]);

  useEffect(() => {
    setTimeout(() => {
      if (ref.current) {
        ref.current.scrollToBottom("auto");
      }
    }, 100);
  }, [messages, ref]);

  async function processMessageToChat(chatMessages) {
    let apiMessages = chatMessages.map((messageObject) => {
      return {
        question: messageObject.message,
        content: messageObject.message,
      };
    });

    const lastMessage = apiMessages.pop()["question"];
    const listMsg = {
      question: lastMessage,
      conversationId: conversationId,
      token: (await Auth.currentSession()).getIdToken().getJwtToken(),
      model_id: modelId,
      location: userGroup,
      language: lastLanguage
    };

    const getData = async () => {
      try {
        const response = await API.post("chatApi", "", {
          body: listMsg,
        });

        setConversationId(response.conversationId);
        setMessages([
          ...chatMessages,
          {
            message: response.answer,
            sender: "STC Bot",
            source_page: response.source_page,
          },
        ]);
      } catch (e) {
        setMessages([
          ...chatMessages,
          {
            message:
              "Hmm, I'm having trouble with this request. Please try again.",
            sender: "STC Bot",
            source_page: {},
          },
        ]);
      } finally {
        setIsTyping(false);
        setIsThinking(false);
      }
    };

    getData();
  }

  function avatarImage(senderName) {
    const avatarDefault = senderName === "STC Bot";
    if (avatarDefault) {
      return <Avatar src={"chatbot.png"} name={"STC Bot"}></Avatar>;
    } else {
      return (
        <Avatar
          src={
            "icon-user.png"
          }
          name={"User"}
        ></Avatar>
      );
    }
  }

  function mapSourceAndPage(message) {
    let items = [];

    Object.keys(message).map((key) => {
      if (key == "source_page") {
        let source_page_obj = message[key];
        Object.keys(source_page_obj).map((k) => {
          items.push(
            <SpaceBetween direction="vertical" size="xs" key={k}>
              <SpaceBetween direction="horizontal" size="xs">
                <Icon name="file" size="small" />
                <Link href={source_page_obj[k].file}>
                  {source_page_obj[k].file_name}
                </Link>
              </SpaceBetween>
            </SpaceBetween>
          );
        });
      }
    });

    return items;
  }

  return (
    <div className="app">
      <MainContainer className="main-container">
        <ChatContainer className="chat-container" backgroundColor="#f1f1f1">
          <MessageList
            ref={ref}
            className="message-list"
            scrollBehavior="smooth"
            autoScrollToBottom={true}
            autoScrollToBottomOnMount={true}
            typingIndicator={
              isTyping ? <TypingIndicator content="Analyzing the response" /> : null
            }
          >
            {messages.map((message, i) => {
              return (
                <>
                  <Message
                    key={i}
                    model={message}
                    avatarPosition={message.sender === "STC Bot" ? "tl" : "tr"}
                  >
                    {avatarImage(message.sender)}
                    <Message.CustomContent>
                      <SpaceBetween direction="vertical" size="xs">
                        {message.message}
                        {message.sender === "STC Bot" &&
                          message.source_page &&
                          Object.keys(message.source_page).length > 0 && (
                            <ExpandableSection
                              defaultExpanded
                              headerText="Sources (by relevance)"
                            >
                              {mapSourceAndPage(message)}
                            </ExpandableSection>
                          )}
                      </SpaceBetween>
                    </Message.CustomContent>
                  </Message>
                </>
              );
            })}
          </MessageList>
          <MessageInput
            placeholder= "Please type your question here"
            onSend={handleSend}
            attachButton={false}
            sendDisabled={isThinking}
          />
        </ChatContainer>
      </MainContainer>
    </div>
  );
}
