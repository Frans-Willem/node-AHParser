var gen=require("./AhoCorasickGenerator");
var AhoCorasickParser=require("./AhoCorasickParser").AhoCorasickParser;
var sys=require("sys");

var words=["he","she","his","hers"];
var root=gen.createNode();
words.forEach(function(w) {
	gen.addWord(root,w,JSON.stringify("{{"+w+"}}"));
});
gen.createAutomaton(root);
var code=gen.exportAutomaton(root,"automaton").join("\r\n");
sys.puts("Code:\r\n"+code);
var exportedRoot=eval(code+" automaton();");


var input=new Buffer("he or she has a nice dog. horde is what makes me happy. silly word: shers","ascii");
var parser=new AhoCorasickParser(exportedRoot);
var splits=[27];
var inputs=[input];
var outputs=[];
splits.forEach(function(s) {
	var c=inputs.pop();
	inputs.push(c.slice(0,s));
	inputs.push(c.slice(s,c.length));
});
inputs.forEach(function(i) {
	sys.puts("-> '"+i.toString()+"'");
	var ret=parser.parse(i);
	ret.forEach(function(r) {
		sys.puts("<- '"+r.toString()+"'");
	});
	outputs.push.apply(outputs,ret);
});
sys.puts("Total output: '"+outputs.join("")+"'");