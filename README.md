# Introduction
`samsung-mdc-protocol` is Node module to encode or decode Samsung displays commands using multiple display control protocol (MDC).

## Main features
- no external dependencies
- regardless of connection type (tcp/serial)
- just encode and decode functions
- no flow control
- helper constans for connection
- easy extensible command file (data.js)

## Usage

```js
const MDC = require('samsung-mdc-protocol');
const net = require('net');
let socket = net.createConnection(7142, '192.168.4.43', () => {
  let enc = MDC.encode('status?', 3);
  console.log('>', enc)
  if(enc.encoded)
    socket.write(enc.encoded);
})
socket.on('data', data => console.log('<', MDC.decode(data)))

/* expected output
> {
  command: 'status?',
  id: 3,
  duration: 1000,
  encodedStr: 'ª\x00\x03\x00\x03',
  encoded: <Buffer aa 00 03 00 03>
}
< {
  raw: <Buffer aa ff 03 09 41 00 00 28 00 25 01 00 00 9a>,
  rawStr: '*\x7F\x03\tA\x00\x00(\x00%\x01\x00\x00\x1A',
  id: 3,
  allValue: {
    ack: 'A',
    rcmd: 0,
    data: [0, 40, 0, 37, 1,  0, 0]
  },
  status: 'OK',
  req: 'status',
  value: {
    power: 'off',
    volume: 40,
    mute: 'off',
    input: 'DP',
    aspect: 1,
    NTimeNF: 0,
    FTimeNF: 0
  }
}
*/
```
# Commands
MDC protocol uses a set of commands. Supported commands are defined in `commands` array from data.js. You can also find accepted values here.   
Commands can accept multiple values or return a complex structures.
Command syntax is `command_name[?][ val1[,val2[...]]]`, but most common are commands with single value.  
Sample commands: `status?, power on, input HDMI`.


## `encode(cmd, id)` function
Encodes human friendly command to bytes according to Samsung MDC protocol.  
- `cmd <string>` - required. The cmd is a human friendly command which corresponds to MDC command name. To read a value you must provide a question mark '?' directly after the name (no space between). Example: 'input?'
- `id <number>` - optional. If not specified, default id 0 will be used. You can also use wildcard id '0xFE'. This affects display regardless of its id. It is usefull when you don't know monitor id or you want to control all displays connected with RS232 chain using single command.

Return value is `cmdObj <Object>`. The most important property is `encoded` which contains encoded command as Buffer. This buffer must be send to display. Other properties are helper ones.

## `decode(data)` function
Decodes response from Samsung display into JS object.
- `data <Buffer|string>` - data read from TCP socket or serial port

Returns `response <Object>` - an response object containing properties:
- `raw <Buffer>` - same as data if it contains valid protocol response
- `rawStr <string>` - raw as string
- `id <number>` - monitor id
- `req <string>` - a parameter or command name (request). Used to identify a response
- `value <string|number|Object>` - decoded value. Return type depends on command
- `allValue <Object>` - some pre-decoded values, specific for MDC protocol.

The function does not control completeness of data. It verifies if `data` is a valid protocol response and tries to decode it. If data is not a valid response, a undefined value is returned.