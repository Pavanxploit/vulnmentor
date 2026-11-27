import { cases } from "./cases.js";

const element = (id) => document.getElementById(id);
const solved = new Set();
const signals = new Set();
function button(text, callback) {
  const item = document.createElement("button");
  item.type = "button";
  item.textContent = text;
  item.addEventListener("click", callback);
  return item;
}
function showCase() {
  const entry = cases.find((item) => item.id === location.hash.slice(1)) || cases[0];
  const done = solved.has(entry.id);
  const fixing = signals.has(entry.id);
  element("cases").replaceChildren(...cases.map((item) => {
    const link = document.createElement("a");
    link.href = "#" + item.id;
    link.textContent = item.title;
    if (item === entry) link.setAttribute("aria-current", "page");
    return link;
  }));
  element("area").textContent = entry.area;
  element("title").textContent = entry.title;
  element("progress").textContent = solved.size + " of " + cases.length + " case reviews complete";
  element("feedback").textContent = "";
  element("next").replaceChildren();
  element("choices").replaceChildren();
  if (done) {
    element("task").textContent = entry.evidence;
    element("feedback").textContent = entry.check;
    const reading = document.createElement("a");
    reading.textContent = "Read the OWASP guidance";
    reading.href = entry.reading;
    element("next").append(reading);
    return;
  }
  element("task").textContent = fixing ? entry.evidence + " Which control would address it?" : entry.task;
  const choices = fixing ? entry.controls : entry.logs;
  choices.forEach((item, index) => {
    const option = button(item, () => {
      if (index !== (fixing ? entry.control : entry.signal)) {
        element("feedback").textContent = fixing ? "Look for a control that enforces the rule on the server." : "Compare the expected permission or limit with the recorded outcome.";
        return;
      }
      (fixing ? solved : signals).add(entry.id);
      showCase();
      element("title").focus();
    });
    if (!fixing) option.className = "event";
    element("choices").append(option);
  });
}
element("title").tabIndex = -1;
window.addEventListener("hashchange", showCase);
showCase();
