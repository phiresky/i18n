import * as mobx from "mobx";
import { makeLoggable } from "mobx-log";
import { render } from "react-dom";
import { App } from "./components/App";
import * as React from "react";
import "./style.scss";
mobx.configure({
	enforceActions: "never",
});

makeLoggable({
	storeConsoleAccess: true,
});

const elem = document.createElement("div");
elem.className = "react-root";
document.body.append(elem);
render(<App />, elem);
