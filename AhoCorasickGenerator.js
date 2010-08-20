function createNode() {
	return [];
}

function addWord(root,word,value) {
	var index,next;
	for (index=0; index<word.length; index++) {
		next=root[word.charCodeAt(index)];
		if (!next) {
			next=root[word.charCodeAt(index)]=createNode();
		}
		root=next;
	}
	if (root.out===undefined) {
		root.out=[];
	}
	root.out.push({length:word.length,value:value});
}

function printTree(root,indent) {
	var ret=[];
	if (root.out) {
		ret.push(indent+"values: "+root.out.join(","));
	}
	var re=/^[0-9]+$/;
	for (var c in root) {
		if (c.match(re)!==null && root[c]!==root) {
			ret.push(indent+String.fromCharCode(c)+" ->");
			ret.push.apply(ret,printTree(root[c],indent+"\t"));
		}
	}
	return ret;
}

function createAutomatonPhase1(root) {
	for (var i=0; i<0xFFFF; i++) {
		if (!root[i]) {
			root[i]=root;
		}
	}
}

function createAutomatonPhase2(root) {
	var Q=[],a,q,r,u,v;
	for (a=0; a<0xFFFF; a++) {
		if ((q=root[a])!==root) {
			q.fail=root;
			Q.push(q);
		}
	}
	var reNum=/^[0-9]+$/;
	while (Q.length>0) {
		r=Q.shift();
		for (a in r) {if (a.match(reNum)!==null) {
			u=r[a];
			Q.push(u);
			v=r.fail;
			while (v[a]===undefined) {
				v=v.fail;
			}
			u.fail=v[a];
			if (u.fail.out) {
				if (!u.out) {
					u.out=[];
				}
				Array.prototype.push.apply(u.out,u.fail.out);
			}
		}}
	}
}

function assignIndices(root) {
	var reNum=/^[0-9]+$/;
	var Q=[root],node,index=0,a,nodes=[];
	while (Q.length>0) {
		node=Q.shift();
		node.index=index++;
		nodes.push(node);
		for (a in node) {if (a.match(reNum)!==null) {
			if (node[a].index === undefined) {
				Q.push(node[a]);
			}
		}}
	}
	return nodes;
}

function outputAutomaton(nodes,name) {
	var reNum=/^[0-9]+$/;
	var ret=[],n,i,a,g;
	ret.push("function "+name+"() {");
	ret.push("\tvar nodes=[],i;");
	ret.push("\tfor (i=0; i<"+nodes.length+"; i++) { nodes[i]={}; }");
	for (i=0; i<nodes.length; i++) {
		n=nodes[i];
		if (n.out) {
			ret.push("\tnodes["+n.index+"].used="+Math.max.apply(Math,n.out.map(function(x) { return x.length; }))+";");
			ret.push("\tnodes["+n.index+"].out="+JSON.stringify(n.out.map(function(x) { return x.value; }))+";");
		}
		if (n.fail) {
			ret.push("\tnodes["+n.index+"].fail=nodes["+n.fail.index+"];");
		}
		for (a in n) {if (a.match(reNum)!==null) {
			g=n[a];
			if (g===n && n.index===0) {
				continue;
			}
			ret.push("\tnodes["+n.index+"]["+a+"]=nodes["+g.index+"];");
		}}
	}
	ret.push("\tfor (i=0; i<0xFFFF; i++) { if (!nodes[0][i]) { nodes[0][i]=nodes[0]; } }");
	ret.push("\treturn nodes[0];");
	ret.push("}");
	return ret;
}



exports.createNode=createNode;
exports.addWord=addWord;
exports.createAutomaton=function(root) {
	createAutomatonPhase1(root);
	createAutomatonPhase2(root);
};
exports.exportAutomaton=function(root,name) {
	return outputAutomaton(assignIndices(root),name);
}