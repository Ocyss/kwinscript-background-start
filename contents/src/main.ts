type maxmin = ["=" | ">" | "<" | ">=" | "<=", number];
type Match = Partial<{
  class: string;
  classR: string;
  name: string;
  nameR: string;
  width: maxmin;
  height: maxmin;
  repeat: number;
  [key: string]: any;
}>;
let match: Match[];

function compareNumberWithMaxMin(number: number, maxmin: maxmin): boolean {
  const [operator, operand] = maxmin;
  switch (operator) {
    case "=":
      return number === operand;
    case ">":
      return number > operand;
    case "<":
      return number < operand;
    case ">=":
      return number >= operand;
    case "<=":
      return number <= operand;
    default:
      return false;
  }
}

const f = (client: KWin.AbstractClient) => {
  const name = String(client.resourceName);
  const className = String(client.resourceClass);
  const width = client.width;
  const height = client.height;
  // print("kwinscript-background-start", name, className, width, height);
  const tempMatch: Match[] = JSON.parse(JSON.stringify(match));
  for (let index = 0; index < tempMatch.length; index++) {
    const m = tempMatch[index];
    let flag = true;
    let repeat = 0;
    for (const key in m) {
      const v = m[key];
      switch (key) {
        case "class":
          flag &&= v === className;
          break;
        case "classR":
          flag &&= new RegExp(v, "g").test(className);
          break;
        case "name":
          flag &&= v === name;
          break;
        case "nameR":
          flag &&= new RegExp(v, "g").test(name);
          break;
        case "width":
          flag &&= compareNumberWithMaxMin(width, v);
          break;
        case "height":
          flag &&= compareNumberWithMaxMin(height, v);
          break;
        case "repeat":
          repeat = v - 1;
          break;
      }
    }
    if (flag) {
      print("kwinscript-background-start", name, className, "close");
      client.closeWindow();
      if (repeat === 0) {
        tempMatch.splice(index, 1);
      } else {
        tempMatch[index].repeat = repeat;
      }
      match = tempMatch;
      print(
        "kwinscript-background-start",
        name,
        className,
        JSON.stringify(match)
      );
      if (match.length === 0) {
        workspace.clientAdded.disconnect(f);
      }
      return;
    }
  }
};

function init(disconnect = true) {
  try {
    match = JSON.parse(readConfig("classmatch", ""));
  } catch (e) {
    print("kwinscript-background-start", "error", JSON.stringify(e));
    return;
  }
  print("kwinscript-background-start", "match", JSON.stringify(match));
  if (disconnect) {
    workspace.clientAdded.disconnect(f);
    runCommand("notify-send", ["kwinscript-background-start", "refresh Ok!"]);
  }
  workspace.clientAdded.connect(f);
}

function runCommand(command: string, parameters: any[]) {
  callDBus(
    "org.kde.klauncher5",
    "/KLauncher",
    "org.kde.KLauncher",
    "exec_blind",
    command,
    parameters
  );
}

registerShortcut(
  "refresh background-start",
  "refresh background-start",
  "Ctrl+Alt+Shift+Meta+C",
  init
);

init(false);
