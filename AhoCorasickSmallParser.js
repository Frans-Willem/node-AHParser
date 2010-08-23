function createParser(root) {
	var _unusedStart=0,
		_unused=[],
		_state=root;
	function parse(buffer) {
		if (buffer.length<1) {
			return;
		}
		var unusedStart=_unusedStart,
			lastRootSeen=unusedStart-1,
			out=[],
			index,s,e,i,u,ue;
		function rootCallback() {
			lastRootSeen=index;
		}
		for (index=0; index<buffer.length; index++) {
			_state=_state(buffer[index],rootCallback);
			if (_state.used) {
				s=unusedStart;
				e=index-(_state.used-1);
				unusedStart=index+1;
				if (s<e) {
					if (s<=_unusedStart && e>=0) {
						//Output entire unused buffer
						out.push.apply(out,_unused);
						s=0;
					} else if (s<=_unusedStart) {
						//NOTE: either s is _unusedStart, or it's positive, seeing as we either start with that value, or we partially flush the buffers and start with that.
						//Output partial unused buffer
						for (i=0; i<_unused.length && s<0; i++) {
							var u=_unused[i];
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
					_unused=[];
					_unusedStart=0;
				} else {
					//Throw away part of the unused buffer
					while (_unusedStart < unusedStart) {
						ue=unusedStart-_unusedStart; //How much should be thrown away from the unused buffer
						u=_unused[0];
						if (u.length>=ue) {
							_unused.shift();
							_unusedStart+=u.length;
						} else {
							_unused[0]=u.slice(ue,u.length);
							_unusedStart+=ue;
						}
					}
				}
			}
			if (_state.out) {
				out.push.apply(out,_state.out);
			}
		}
		if (_state===root) {
			//We're at the root, so we output all saved up unused stuff
			out.push.apply(out,_unused);
			_unused=[];
			_unusedStart=0;
			unusedStart=Math.max(0,unusedStart);
			if (unusedStart<buffer.length) {
				out.push(buffer.slice(unusedStart,buffer.length));
			}
		} else {
			if (lastRootSeen>=unusedStart) {
				//If we've actually seen the root in the unused part, we can flush out everything up to that point already
				out.push.apply(out,_unused);
				_unused=[];
				_unusedStart=0;
				if (lastRootSeen>unusedStart) {
					out.push(buffer.slice(Math.max(0,unusedStart),lastRootSeen));
				}
				unusedStart=Math.max(lastRootSeen,unusedStart);
			}
			if (buffer.length>unusedStart) {
				//We've got some parts of the buffer that are still not used
				unusedStart=Math.max(0,unusedStart);
				_unused.push(buffer.slice(unusedStart,buffer.length));
				_unusedStart-=buffer.length-unusedStart;
			}
		}
		return out;
	}
	return parse;
}

exports.createParser=createParser;