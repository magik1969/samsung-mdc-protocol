/*
 * Script for testing samsung-mdc-protocol with real display.
 * You need to know display IP. Verify connection using ping.
 * You must provide display IP as process argument eg 'node test 192.168.4.43'
 * The script uses MDC.addressDefaults.wildcard_id as display id.
 * If you want to use real display id, put it as second argument, behind the IP number
 * Test sends only "read commands" and does not change anything in display configuration.
 */
const net = require('node:net')
const MDC = require('./mdc')

let commands = MDC.commands;
commands = commands.filter(el => el.hasOwnProperty('mode') && el.mode.includes('r'));
console.log(commands)
let args = process.argv;
args.splice(0, 2);
let host =args[0];
let id = args.length>1? Number(args[1]): MDC.addressDefaults.wildcard_id;

let socket = new net.Socket();
socket.on('data', data => console.log('<', MDC.decode(data)));

if(host) //process argument
  socket.connect(MDC.tcpDefaults.port, host, () => dequeue());
else
  console.log('Please provide display IP as argument');

dequeue = function(){
  if(commands.length < 1)
    return;
  let str = `${commands[0].name}?`;
  let cmdo = MDC.encode(str, id);
  console.log('>', cmdo);
  if(cmdo.encoded.length > 0)
    socket.write(cmdo.encoded)
  setTimeout((() =>{
    commands.shift()
    dequeue();
  }).bind(this), cmdo.duration)
}