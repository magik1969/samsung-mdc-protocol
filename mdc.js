const commands = require('./data');
const addressDefaults = {
    id: 0,
	wildcard_id: 0xFE
}
const tcpDefaults = {
	port: 1515
}
const serialDefaults = {
	baudRate: 9600,
	dataBits:8,
	parity: 'none',
	stopBits: 1
}
const optionsDefaults = {
	encoding: 'ascii',
    wDuration: 1000,
	rDuration: 1000,
	splitter: {timeout: 1500}
}

/**
 * Encode command for device using its communication protocol
 * @param {string} cmd  - command to encode
 * @param {number} id  - display id, default is 0, 0xFE is a wilcard.
 * @returns {Object} cmdObj - an object containing encoded data and some other properties
 * TODO: process commands by code
 */
function encode(cmd, id = addressDefaults.id){
	let cmdObj = {
        command: cmd,
        id: id
    }
	let res = /(?<name>\w+)(?<mode>\?)? ?(?<values>[\w-, ]+)?/.exec(cmd);
	if(!res){
		cmdObj['status'] = 'Err'
		cmdObj['more'] = 'Wrong command format'
		return cmdObj;
	}
	let name = res.groups.name;
	let mode = res.groups.mode;
	let values = res.groups.values;
	let vals = [];
	if(typeof values !== 'undefined'){
		vals = values.split(','); //as array
		vals = vals.map(val => val.trim());
	}
	let code; //command code
	let cmdef = commands.find(el => el.name.toLowerCase() == name.toLowerCase());
	if(!isNaN(Number(name)))// command as its code
		code = Number(name) & 0x00FF;
	else if(cmdef)//command defined in data.js
			code = cmdef.cmd;
	else{
		cmdObj['status'] = 'Err'
		cmdObj['more'] = 'Command not defined'
		return cmdObj;
	}

	let valdef; //value definition as array from data.js
	if(Array.isArray(cmdef.value))
		valdef = cmdef.value;
	else{
		valdef = [];
		valdef.push(cmdef.value);
	}
	//! consider comparing vals.length and valdef.length
	let encStr = '\xAA';
	encStr += String.fromCharCode(code);
	encStr += String.fromCharCode(id);
	let dataLength = vals.length;
	if(mode == '?'){ //read command
		if(cmdef.hasOwnProperty('sub')){ //sub exists
			encStr += '\x01';
			encStr += String.fromCharCode(cmdef.sub)
		}
		else encStr += '\x00' //regular command, no sub
		cmdObj['duration'] = cmdef.rDuration? cmdef.rDuration: optionsDefaults.rDuration;
	}
	else{ //write command
		if(cmdef.hasOwnProperty('sub')){ //sub exists
			dataLength += 1;
			encStr += String.fromCharCode(dataLength);
			encStr += String.fromCharCode(cmdef.sub)
		}
		else
			encStr += String.fromCharCode(dataLength);

		//values to numbers using Number() or dictionary
			vals = vals.map((val, ind) => {
			if(!isNaN(Number(val))) //number value, nothing to do
				return Number(val)
			else{
				try { //to use dictionary	
					let dicnum = valdef[ind].dic.find(el => val.toUpperCase() == el[0].toUpperCase());
					return dicnum[1];
				}
				catch (err) {
					return val;
				} //not found
			}
		})
		//process values using set()
		vals = vals.map((val, ind) => {
			if(valdef[ind].set)
				return valdef[ind].set(val);
			else return val;
		})
		//verify if all values are numbers now
		for (let i=0; i<vals.length; i++) {
			if(isNaN(vals[i])){
				cmdObj['status'] = 'Err';
				cmdObj['more'] = `${vals[i]} -wrong value`;
				return cmdObj;
			}
			else 
				encStr += String.fromCharCode(vals[i])
		}
		cmdObj['duration'] = cmdef.wDuration? cmdef.wDuration: optionsDefaults.wDuration;
	}

	let buf = Buffer.from(encStr, optionsDefaults.encoding);
	let chs = 0;
	for(let i=1; i<buf.length; i++){
		chs += buf[i];
	}
	chs = chs & 0x00FF;
	encStr += String.fromCharCode(chs)
	cmdObj['encodedStr'] = encStr;
	cmdObj['encoded'] = Buffer.from(encStr, optionsDefaults.encoding);
	return cmdObj;
}

/**
 * Decode response from display to useful form
 * @param {Buffer|string} data  - data to decode
 * @returns {Object} response - an response object
 * TODO: 
 * multiple bytes values decode	(lightSens, cmd: 0x50)
 * decode commands with sub command
 */
function decode(data){
	let response = {}
	response['raw'] = data;
	let str = data.toString(optionsDefaults.encoding)
	response['rawStr'] = str;
	let start = data.indexOf(0xAA);
	if(start == -1)// not a valid vessage
		return;
	let trimed;
	if(start >= 0)
		trimed = data.subarray(start);
	let id = trimed[2];
	response['id'] = id;
	let allvals = {}
	response['allValue'] = allvals;
	let dlength = trimed[3];
	let ack = String.fromCharCode(trimed[4]);
	allvals['ack'] = ack;
	response['status'] = ack=='A'? 'OK': 'ERR'; //status from protocol
	let rcmd = trimed[5];
	allvals['rcmd'] = rcmd; //! sub also if exists
	let cmdef = commands.find(el => el.cmd == rcmd);//! subs
	if(!cmdef){
		response['more'] = 'Decode warning. Command definition not found';
		return response;
	}
	response['req'] = cmdef.name;
	let valdef; //value definition as array from data.js
	if(Array.isArray(cmdef.value))
		valdef = cmdef.value;
	else{
		valdef = [];
		valdef.push(cmdef.value);
	}
	const dstart = cmdef.sub? 7: 6;
	let valbuff = trimed.subarray(dstart, trimed.length-1);
	let valarr = [...valbuff];
	allvals['data'] = valarr;
	if(valbuff.length != valdef.length){	//ascii response
		let str = valbuff.toString(optionsDefaults.encoding)
		response['value'] = str.replaceAll('\x00', '');
		return response;
	}
	valarr = valarr.map((val, ind) => { // try to use dictionaries for values
		try{
			const dicval = valdef[ind].dic.find(el => el[1] == val);
			if(Array.isArray(dicval[0]))
				return dicval[0][0];
			else
				return dicval[0];
		}
		catch(err){
			return val;
		}
	})
	valarr = valarr.map((val, ind) => {	//try to use get() function
		try{
			const getval = valdef[ind].get(val);
			return getval;
		}
		catch(err){
			return val;
		}
	})

	if(valarr.length == 1)	//single value
		response['value'] = valarr[0];
	else{	//multiple values 
		let ov = {};
		valarr.forEach((val, ind) => {
			ov[valdef[ind].name] = val; //maybe try-catch will be safer
		})
		response['value'] = ov;
	}
	return response;
}

module.exports = {
	encode,
	decode,
	tcpDefaults,
	serialDefaults,
	addressDefaults,
	optionsDefaults,
	commands
};