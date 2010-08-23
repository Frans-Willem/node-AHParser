var gen=require("./AhoCorasickGenerator");
var sys=require("sys");
var ESC=27;

var inputs=[
  [[3],"Break"],
  [[4],"EOF"],
  [[13],"Enter"],
  [[127],"Backspace"],
  [[8],"Backspace"],
  [[21],"DeleteLine"],
  [[11],"DeleteToEnd"],
  [[1],"Home"],
  [[5],"End"],
  [[2],"Back"],
  [[6],"Forward"],
  [[14],"HistoryNext"],
  [[9],"Tab"],
  [[16],"HistoryPrev"],
  [[24],"CtrlZ"],
  [ESC,"Escape"],//Make sure lone escape characters are not printed back
  [[ESC,98],"BackWord"], //xterm style meta-b
  [[ESC,102],"ForwardWord"], //xterm style meta-f
  [[ESC,91,68],"Back"],
  [[ESC,91,67],"Forward"],
  [[ESC,91,72],"Home"], //xterm style Home
  [[ESC,91,70],"End"], //xterm style End
  [[ESC,91,55],"Home"], //rxvt style Home
  [[ESC,91,56],"End"], //rxvt style End
  [[ESC,91,65],"HistoryPrev"],
  [[ESC,91,66],"HistoyrNext"],
  [[ESC,91,51],"Delete"],
  [[ESC,79,68],"Back"],
  [[ESC,79,67],"Forward"],
  [[ESC,79,72],"Home"], //Putty xterm style Home
  [[ESC,79,70],"End"], //Putty xterm style End
  [[ESC,79,55],"Home"], //Putty rxvt style Home
  [[ESC,79,56],"End"], //Putty rxvt style End
  [[ESC,79,65],"HistoryPrev"],
  [[ESC,79,66],"HistoyrNext"],
  [[ESC,79,51],"Delete"],
  //Putty
  [[ESC,"[1~"],"Home"],
  [[ESC,"[4~"],"End"],
  ["\r","CarriageReturn"],
  ["\n","NewLine"]
];

function inputToString(input) {
  if (Array.isArray(input)) {
    return input.map(inputToString).join("");
  }
  if (typeof(input)==="string") {
    return input;
  }
  if (typeof(input)==="number") {
    return String.fromCharCode(input);
  }
  throw new Error("Invalid input");
}

var root=gen.createNode();
var outputs=[];
inputs.forEach(function(input) {
  var inputString=inputToString(input[0]);
  var inputOutput=JSON.stringify(input[1]);
  gen.addWord(root,inputString,inputOutput);
  if (outputs.indexOf(inputOutput)===-1) {
    outputs.push(inputOutput);
  }
});
gen.createAutomaton(root);
gen.exportAutomaton(root,"replAutomaton").forEach(function(line) {
  sys.puts(line.replace(/\t/g,"  "));
});
sys.puts("exports.root=replAutomaton();");
sys.puts("exports.outputs=[");
outputs.forEach(function(output,index) {
  sys.puts("  "+output+((index<outputs.length-1)?",":""));
});
sys.puts("];");