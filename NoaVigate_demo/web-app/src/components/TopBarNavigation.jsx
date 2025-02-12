/**
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0
*/

import { useState, useEffect } from "react";
import TopNav from "@cloudscape-design/components/top-navigation";
import { applyMode, Mode } from "@cloudscape-design/global-styles";
import { Auth } from "aws-amplify";
import { useHistory } from "react-router-dom";
import { I18n } from '@aws-amplify/core';
import logo from "../logo.png";

import {
  resetChat,
  resetDocument,
  resetModel,
  sendValueOne,
  setCallbackOne,
  sendValueTwo,
  setCallbackTwo,
} from "../pages/Home/chatUtils";


const i18nStrings = {};

const APP_TITLE = /*process.env.REACT_APP_CUSTOMER_NAME || */ "Save the Children";


export function TopBarNavigation() {
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState("");
  const [selectedModel, setSelectedModel] = useState("Anthropic Claude Instant");
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [isAdmin, setIsAdmin] = useState(false)

  const setDarkLightTheme = () => {
    if (darkMode) {
      localStorage.setItem("darkMode", false);
      applyMode(Mode.Light);
      setDarkMode(false);
    } else {
      localStorage.setItem("darkMode", true);
      applyMode(Mode.Dark);
      setDarkMode(true);
    }
  };

  function handleResetChat() {
    resetChat();
  }

  function handleResetDocument() {
    resetDocument();
  }

  async function signOut() {
    try {
      await Auth.signOut();
    } catch (error) {
      console.log("error signing out: ", error);
    }
  }

  async function onItemClickEvent(event) {
    if (event.detail.id === "signout") {
      try {
        await Auth.signOut();
      } catch (error) {
        console.log("error signing out: ", error);
      }
    }
  }
  const onItemClickEventReset = () => {
    if (window.location.href.includes("newdoc"))
      window.location.href = "/";
    else
      handleResetChat();
  };

  const onItemClickEventModel = (event) => {
    const selectedItemId = event.detail.id;
    sendValueOne(selectedItemId);
    setSelectedModel(selectedItemId);
    resetModel();
    resetChat();

    setCallbackOne((value) => {
      console.log("Model Changed");
    });
  };
  
  const onItemClickEventLanguage = (event) => {
    const selectedItemId = event.detail.id;
    sendValueTwo(selectedItemId);
    setSelectedLanguage(selectedItemId);

    setCallbackTwo((language) => {
      console.log("Language Changed");
    });
  };

  async function getUser() { 
    try { 
        let currentUser = await Auth.currentAuthenticatedUser(); 
        let userGroups = currentUser.signInUserSession.accessToken.payload["cognito:groups"];
        setUser(currentUser.attributes.email || currentUser.username); 
        console.log("User:", currentUser.attributes.email || currentUser.username); // Add this line
        setIsAdmin(userGroups.includes("Admin")); 
        console.log (userGroups);
    } catch (error) { 
        console.log("error getting current user: ", error); 
    } 
  }

  useEffect(() => {
    console.log(window.location);
  

    getUser();
  }, []);
  
  // Function to create TopNav for admin
  const renderAdminTopNav = () => {
    return (
      <TopNav
     
      i18nStrings={i18nStrings}
      identity={{
        logo: {
          src: logo,
        },
        
      }}
      utilities={[
        {
          type: "button",
          variant: "primary",
          iconName: "contact",
          text: "   New Chat",
          title: "   New Chat",
          onClick: () => onItemClickEventReset(),
        },
        {
          type: "button",
          variant: "primary",
          iconName: "upload",
          text: "   Add new documents",
          title: "   Add new documents",
          href: "/newdoc",
        },
        {
          type: "menu-dropdown",
          text: selectedLanguage,
          onItemClick: (e) => onItemClickEventLanguage(e),
          items: [
            {
              id: "Spanish",
              text: "Español"
            },
            {
              id: "English",
              text: "English"
            },
            {
              id: "Arabic",
              text: "عربي"
            },
            {
              id: "French",
              text: "Français"
            },
            {
              id: "Portuguese",
              text: "Português"
            }
          ].filter((item) => item.id !== selectedLanguage),
        },
        {
          type: "menu-dropdown",
          text: selectedModel,
          iconName: "script",
          onItemClick: (e) => onItemClickEventModel(e),
          items: [
            {
              id: "Anthropic Claude V2.1",
              text: "Anthropic Claude V2.1"
            },
            {
              id: "Anthropic Claude Instant",
              text: "Anthropic Claude Instant"
            },
            {
              id: "Amazon Titan Express",
              text: "Amazon Titan Express"
            }
          ].filter((item) => item.id !== selectedModel),
        },
        {
          type: "menu-dropdown",
          text: user,
          description: user,
          iconName: "user-profile",
          onItemClick: (e) => onItemClickEvent(e),
          items: [
            {
              id: "signout",
              type: "button",
              variant: "primary",
              iconName: "unlocked",
              text: "Sign Out",
              title: "Sign Out",
            },
          ],
        },
      ]}
    />
    );
  };
  
  // Function to create TopNav for regular user
  const renderUserTopNav = () => {
    return (
      <TopNav
      className="top-nav"
      i18nStrings={i18nStrings}
      identity={{
        logo: {
          src: logo,
        },
        
      }}
      utilities={[
        {
          type: "button",
          variant: "primary",
          iconName: "contact",
          text: "   New Chat",
          title: "   New Chat",
          onClick: () => onItemClickEventReset(),
        },
        {
          type: "menu-dropdown",
          text: selectedLanguage,
          onItemClick: (e) => onItemClickEventLanguage(e),
          items: [
            {
              id: "Spanish",
              text: "Español"
            },
            {
              id: "English",
              text: "English"
            },
            {
              id: "Arabic",
              text: "عربي"
            },
            {
              id: "French",
              text: "Français"
            },
            {
              id: "Portuguese",
              text: "Português"
            }
          ].filter((item) => item.id !== selectedLanguage),
        },
        {
          type: "menu-dropdown",
          text: user,
          description: user,
          iconName: "user-profile",
          onItemClick: (e) => onItemClickEvent(e),
          items: [
            {
              id: "signout",
              type: "button",
              variant: "primary",
              iconName: "unlocked",
              text: "Sign Out",
              title: "Sign Out",
            },
          ],
        },
      ]}
    />
    );
  };

  return (
    <>
      {isAdmin ? renderAdminTopNav() : renderUserTopNav()}
    </>
  );
}
