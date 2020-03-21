import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import Select from "./Select";
import * as serviceWorker from "./serviceWorker";
import { HashRouter, Route, Switch } from "react-router-dom";

const whyDidYouRender = require("@welldone-software/why-did-you-render");

whyDidYouRender(React, {
    trackAllPureComponents: true
});

ReactDOM.render(
    <HashRouter base="/wallstreet">
        <Route path="/:quotes" component={App} />
    </HashRouter>,
    document.getElementById("root")
);

serviceWorker.unregister();
