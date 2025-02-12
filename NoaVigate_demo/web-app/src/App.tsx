/**
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0
*/

import React from "react";
import { withAuthenticator} from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import { TopBarNavigation } from "./components/TopBarNavigation";
import Index from "./pages/Home/Index";
import { Chat } from "./pages/Home/Chat";
import "./App.css";
import { OnboardDocs } from "./pages/Home/Onboard";
import { I18n } from 'aws-amplify';
import { translations } from '@aws-amplify/ui-react';


const Footer = () => (
  <footer className="footer">
    <img src="awslogo.png" alt="AWS" className="footer-logo" />
  </footer>
);

/*Footer: outside of the '/newdoc' path, the <Footer/> is not rendered.*/
function App() {
  return (
    <React.Fragment>
      <TopBarNavigation/>
      <BrowserRouter>
        <Switch>
          <Route path="/" exact={true} component={Chat} />
          <Route path="/newdoc" exact={true} component={OnboardDocs} />
        </Switch>
        {window.location.pathname !== '/newdoc' && <Footer/>}
      </BrowserRouter>
    </React.Fragment>
  );
}

const MyTheme = {
  hideSignUp: true,
};



I18n.putVocabularies(translations);
/* You can set the default language with setLanguage, or delete it if you want to use the user one automatically */
I18n.setLanguage('en');

/*Fixing some translations of putVocabularies*/
I18n.putVocabularies({
  es: {
    'Enter your Username': 'Ingrese el nombre de usuario',
  },
  fr: {
    'Enter your Username': "Saisissez votre nom d'utilisateur",
    'Enter your Password': 'Saisissez votre mot de passe',
  }
});

export default withAuthenticator(App, MyTheme);


