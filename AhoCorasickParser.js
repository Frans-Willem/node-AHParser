function AhoCorasickParser(automaton) {
	this.root=automaton;
	this.state=this.root;
	this.unused=[];
	this.unusedStart=0;
}

AhoCorasickParser.prototype.parse=function(buffer) {
	if (buffer.length<1) {
		return;
	}
	var unusedStart=this.unusedStart,
		lastRootSeen=unusedStart-1,
		out=[],
		index,s,e,i,u,ue;
	function rootCallback() {
		lastRootSeen=index;
	}
	for (index=0; index<buffer.length; index++) {
		this.state=this.state(buffer[index],rootCallback);
		if (this.state.used) {
			s=unusedStart;
			e=index-(this.state.used-1);
			unusedStart=index+1;
			if (s<e) {
				if (s<=this.unusedStart && e>=0) {
					//Output entire unused buffer
					out.push.apply(out,this.unused);
					s=0;
				} else if (s<=this.unusedStart) {
					//NOTE: either s is this.unusedStart, or it's positive, seeing as we either start with that value, or we partially flush the buffers and start with that.
					//Output partial unused buffer
					for (i=0; i<this.unused.length && s<0; i++) {
						var u=this.unused[i];
						ue=e-s; //How much should be output from this buffer
						if (ue>=u.length) {
							out.push(u);
							s+=u.length;
						} else if (ue>0) {
							out.push(u.slice(0,ue));
							s+=ue;
						}
					}
				}
				if (e>0) {
					out.push(buffer.slice(s,e));
				}
			}
			if (unusedStart>=0) {
				//Flush the unused buffers completely
				this.unused=[];
				this.unusedStart=0;
			} else {
				//Throw away part of the unused buffer
				while (this.unusedStart < unusedStart) {
					ue=unusedStart-this.unusedStart; //How much should be thrown away from the unused buffer
					u=this.unused[0];
					if (u.length>=ue) {
						this.unused.shift();
						this.unusedStart+=u.length;
					} else {
						this.unused[0]=u.slice(ue,u.length);
						this.unusedStart+=ue;
					}
				}
			}
		}
		if (this.state.out) {
			out.push.apply(out,this.state.out);
		}
	}
	if (this.state===this.root) {
		//We're at the root, so we output all saved up unused stuff
		out.push.apply(out,this.unused);
		this.unused=[];
		this.unusedStart=0;
		unusedStart=Math.max(0,unusedStart);
		if (unusedStart<buffer.length) {
			out.push(buffer.slice(unusedStart,buffer.length));
		}
	} else {
		if (lastRootSeen>=unusedStart) {
			//If we've actually seen the root in the unused part, we can flush out everything up to that point already
			out.push.apply(out,this.unused);
			this.unused=[];
			this.unusedStart=0;
			if (lastRootSeen>unusedStart) {
				out.push(buffer.slice(Math.max(0,unusedStart),lastRootSeen));
			}
			unusedStart=Math.max(lastRootSeen,unusedStart);
		}
		if (buffer.length>unusedStart) {
			//We've got some parts of the buffer that are still not used
			unusedStart=Math.max(0,unusedStart);
			this.unused.push(buffer.slice(unusedStart,buffer.length));
			this.unusedStart-=buffer.length-unusedStart;
		}
	}
	return out;
}
exports.AhoCorasickParser=AhoCorasickParser;

exports.createFunction=function(root) {
	var parser=new AhoCorasickParser(root);
	return function(b) {
		return parser.parse(b);
	}
}