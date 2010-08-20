var sys=require("sys");

var nodes=[],i;
for (i=0; i<10; i++) { nodes[i]={index:i}; }
nodes[0][104]=nodes[1];
nodes[0][115]=nodes[2];
nodes[1].fail=nodes[0];
nodes[1][101]=nodes[3];
nodes[1][105]=nodes[4];
nodes[2].fail=nodes[0];
nodes[2][104]=nodes[5];
nodes[3].used=2;
nodes[3].out=[1];
nodes[3].fail=nodes[0];
nodes[3][114]=nodes[6];
nodes[4].fail=nodes[0];
nodes[4][115]=nodes[7];
nodes[5].fail=nodes[1];
nodes[5][101]=nodes[8];
nodes[6].fail=nodes[0];
nodes[6][115]=nodes[9];
nodes[7].used=3;
nodes[7].out=[3];
nodes[7].fail=nodes[2];
nodes[8].used=3;
nodes[8].out=[2,1];
nodes[8].fail=nodes[3];
nodes[9].used=4;
nodes[9].out=[4];
nodes[9].fail=nodes[2];
for (i=0; i<0xFFFF; i++) { if (!nodes[0][i]) { nodes[0][i]=nodes[0]; } }


function AhoCorasickParser(automaton) {
	this.root=automaton[0];
	this.state=this.root;
	this.unused=[];
	this.unusedStart=0;
}

AhoCorasickParser.prototype.parse=function(buffer) {
	if (buffer.length<1) {
		return;
	}
	var unusedStart=this.unusedStart;
	var lastRootSeen=unusedStart-1;
	var out=[];
	var index,chr,s,e,i,u,ue;
	for (index=0; index<buffer.length; index++) {
		chr=buffer[index];
		while (!this.state[chr]) {
			this.state=this.state.fail;
		}
		if (this.state===this.root) {
			lastRootSeen=index;
		}
		this.state=this.state[chr];
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