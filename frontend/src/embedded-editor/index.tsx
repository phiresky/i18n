import * as ReactDOM from "react-dom";
import { App } from "./components/App";
import * as React from "react";

const elem = document.createElement("div");
document.body.append(elem);
ReactDOM.render(<App />, elem);
