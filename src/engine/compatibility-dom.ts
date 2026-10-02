import { CHAIN_LENGTH } from "./engine";

const option = (value: string, label = value): HTMLOptionElement =>
  new Option(label, value);

function select(
  id: string,
  values: readonly string[],
  selected = 0,
): HTMLSelectElement {
  const element = document.createElement("select");
  element.id = id;
  values.forEach((value) => element.add(option(value)));
  element.selectedIndex = selected;
  element.tabIndex = -1;
  return element;
}

export function createCompatibilityDom(): HTMLElement {
  const existing = document.querySelector<HTMLElement>("#sikore-compat");
  if (existing) return existing;

  const root = document.createElement("div");
  root.id = "sikore-compat";
  root.setAttribute("aria-hidden", "true");
  root.inert = true;

  const options = document.createElement("form");
  options.name = "optionform";
  options.append(
    select("level", ["500M10"]),
    select("fmaxresult", ["500"]),
    select("fnegativ", ["nein", "ja"]),
    select("fminplusminus", ["1"]),
    select("fmaxplusminus", ["250"]),
    select("fchancemal", ["0", "1", "2"], 2),
    select("fminmal", ["2"]),
    select("fmaxmal", ["10"]),
    select("flimitfakt", ["ja", "nein"]),
    select("fchancegeteilt", ["0", "1", "2"], 2),
    select("fmingeteilt", ["2"]),
    select("fmaxgeteilt", ["10"]),
    select("flimitquot", ["ja", "nein"]),
    select("fkettenlaenge", ["4", "8", "12"], 2),
    select("fkettenanzahl", ["1"]),
    select("fschreibweise", ["operatoren"]),
    select("floesungshilfe", ["nie"]),
    select("fleveltext", ["eigener"]),
    select("flivehelp", ["ja", "nein"], 1),
    select("flivezeit", ["0"]),
    select("ffigs", ["0"]),
  );

  for (const [id, value] of [
    ["fleveltext1", "Kopfrechnen"],
    ["fleveltext2", ""],
  ] as const) {
    const input = document.createElement("input");
    input.id = id;
    input.value = value;
    input.tabIndex = -1;
    options.append(input);
  }

  for (const id of ["leveltexts2", "favlink"]) {
    const element = document.createElement(id === "favlink" ? "a" : "span");
    element.id = id;
    element.tabIndex = -1;
    options.append(element);
  }

  const liveForm = document.createElement("form");
  liveForm.name = "liveform";
  liveForm.addEventListener("reset", (event) => event.preventDefault());

  for (const id of [
    "livetextlinks",
    "livetextrechts",
    "playhead",
    "fstart",
    "zeilanf1",
    "zeilanf2",
    "flivestatus",
    "flivestatus2",
    "loesungszeilendiv",
  ]) {
    const element = document.createElement("span");
    element.id = id;
    (id.startsWith("live") || id === "playhead" ? root : liveForm).append(
      element,
    );
  }

  const mistakes = document.createElement("input");
  mistakes.id = "ffehler";
  mistakes.value = "0";
  mistakes.tabIndex = -1;
  liveForm.querySelector("#flivestatus2")?.append(mistakes);

  for (let index = 0; index < CHAIN_LENGTH; index += 1) {
    const operator = document.createElement("span");
    operator.id = `fop${index}`;

    const cell = document.createElement("span");
    cell.id = `tdi${index}`;
    const input = document.createElement("input");
    input.name = `i${index}`;
    input.tabIndex = -1;
    const marker = document.createElement("img");
    marker.name = `im${index}`;
    marker.alt = "";
    const result = document.createElement("a");
    result.id = `ri${index}`;
    result.tabIndex = -1;

    cell.append(input, marker);
    liveForm.append(operator, cell, result);
  }

  root.append(options, liveForm);
  document.body.append(root);
  return root;
}
