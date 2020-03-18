import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import Select from "./Select";
import * as serviceWorker from "./serviceWorker";
import { BrowserRouter as Router } from "react-router-dom";

ReactDOM.render(
    <Router>
        <div>
            <Select />
            <App />
        </div>
    </Router>,
    document.getElementById("root")
);

serviceWorker.unregister();
