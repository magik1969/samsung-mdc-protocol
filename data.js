const inputs = [
    ['S-Video', 0x04],
    ['Component',0x08],
    ['AV',0x0C],
    ['AV2',0x0D],
    ['SCART1',0x0E],
    ['PC',0x14],
    ['DVI',0x18],
    ['BNC',0x1E],
    ['DVI-Video',0x1F],
    ['MagicInfo',0x20],
    ['HDMI1, HDMI',0x21],
    ['HDMI1-PC',0x22],
    ['HDMI2',0x23],
    ['HDMI2-PC',0x24],
    [['DP','DP1','DisplayPort1'],0x25],
    ['DP2',0x26],
    ['DP3',0x27],
    ['HDMI3',0x31],
    ['HDMI3-PC',0x32],
    ['HDMI4',0x33],
    ['HDMI4-PC',0x34],
    ['TV-DTV',0x40],
    ['HD-BaseT',0x55],
    ['OCM',0x56],
    ['MagicInfo-S',0x60],
    ['Screen Mirroring',0x61],
    ['USB',0x62],
    ['URL Launcher',0x63],
    ['Whiteboard',0x64],
    ['Web Browser',0x65],
    ['Remote Workspace',0x66]
]

const commands = [
    //Status Control
    {name: 'status', cmd: 0x00, mode: 'r', value:[
        {name: 'power', dic: [['on', 1], ['off', 0]]},
        {name: 'volume'},
        {name: 'mute', dic: [['on', 1], ['off', 0]]},
        {name: 'input', dic: inputs},
        {name: 'aspect'},
        {name: 'NTimeNF'},
        {name: 'FTimeNF'}
    ]},

    //Serial Number Control
    {name: 'sernum', cmd: 0x0B,  mode: 'r'},

    //Software Version Control
    {name: 'software', cmd: 0x0E, mode: 'r'},

    //Power Control
    {name: 'power', cmd: 0x11, mode: 'rw', wDuration: 5000, value: {dic: [['off', 0], ['on', 1], ['reboot', 2]]}},

    //Volume Control
    {name: 'volume', cmd: 0x12, mode: 'rw', value: {min: 0, max: 100}},

    //Mute control
    {name: 'mute', cmd: 0x13, mode:'rw', value: {dic: [['on', 1], ['off', 0]]}},

    //Input Source Control
    {name: 'input', cmd: 0x14, mode: 'rw', value: {dic: inputs}},

    //Screen Size Control. Get screen size (diagonal) in inches. Command: 'screensize?'
    {name: 'screenSize', cmd: 0x19, mode: 'r', value: {unit: 'inch'}},

     //Outdoor Mode
    {name: 'outdoor', cmd: 0x1A, sub: 0x81, mode: 'rw', value: {dic: [['on', 1], ['off', 0]]}},

    /*
    //Network Configuration
    //TODO: set/get functions
    {name: 'network', cmd: 0x1B, sub: 0x82, value: [
        {name: 'IP', length: 4, set: function(){}, get: function(){}},
        {name: 'mask', length: 4, set: function(){}, get: function(){}},
        {name: 'gateway', length: 4, set: function(){}, get: function(){}},
        {name: 'DNS', length: 4, set: function(){}, get: function(){}}]
    }
    */
    /*
    //Network Access Point Configuration
    //TODO: native string values support
    {name: 'AP', cmd: '0x1B', sub: 0x8A, mode: 'w', value: [
        {name: 'SSID', length: 'var' },
        {name: 'passwd', length: 'var'}
    ]},
    */
    /*
    //Weekly Restart
    //TODO: array values, set function
    {name: 'restart', cmd: 0x1B, sub: 0xA2, value: [
        {name: 'days', dic: [
            ['Monday',      0b01000000],
            ['Tuesday',     0b00100000],
            ['Wendesday',   0b00010000],
            ['Thursday',    0b00001000],
            ['Friday',      0b00000100],
            ['Saturday',    0b00000010],
            ['Sunday',      0b00000001]],
        set: function(){}},
        {name: 'hour', min: 0, max: 23},
        {name: 'min', min: 0, max: 59}
    ]},
    */

    //Contrast control
    {name: 'contrast', cmd: 0x24, mode: 'rw', value:{ min: 0, max: 100}},

    //Brightness control
    {name: 'brightness', cmd: 0x25, mode: 'rw', value:{ min: 0, max: 100}},

    //Sharpness control
    {name: 'sharpness', cmd: 0x26, mode: 'rw', value:{ min: 0, max: 100}},

    //Color control (saturation)
    {name: 'color', cmd: 0x27, mode: 'rw', value:{ min: 0, max: 100}},

    //Tint control. Only even values
    {name: 'tint', cmd: 0x28, mode: 'rw', value:{ min: 0, max: 100}},

    //RGB contrast control
    {name: 'rgbContrast', cmd: 0x37, mode: 'rw', value:{ min: 0, max: 100}},

    //RGB brightness control
    {name: 'rgbBrightness', cmd: 0x38, mode: 'rw', value:{ min: 0, max: 100}},

    //Fan Speed Setting
    {name:'fanSpeed', cmd: 0x44, mode: 'rw', value:{ min: 0, max: 100}},
    
    // Sensor Control/Light Sensor
    {name: 'lightSens', cmd: 0x50, sub: 0x00, mode:'r', value: {length: 2, unit: 'lux'}},

    //Video Wall Mode Control (border compensation)
    {name: 'wallMode', cmd: 0x5C, mode: 'rw', value: {dic: [
        ['natural', 0], //border compensation on
        ['full', 1] //no compensation
    ]}},
    
    //Volume Up/Down
    {name: 'volumeUpDown', cmd: 0x62, mode: 'w', value: {dic: [['up', 0], ['down', 1]]}},

    //Video Wall On (matrix mode)
    //Sets of or off matrix mode i.e. ignores or not display internal scaler
    {name: 'wallOn', cmd: 0x84, mode: 'rw', value:{dic: [['on', 1], ['off', 0]]}},

    //Video Wall User Control (wall definition)
    //The command setups display internal scaler to show only a fragment of input signal. It uses 2 values:
    //First (div -divider) is wall geometry given as ColsxRows. '2x3' means 2 columns by 3 rows geometry
    //Second (SNo -sequence number) is an ordinal number for the dispaly using Z ordering scheme. Number 1 is for upper left display in the wall
    //Example: "wallDef 3x3,1" setups display to show a fragment for first(upper left) display in 3x3 wall
    {name: 'wallDef', cmd: 0x89, value: [
        {name: 'div', min: 0, max: 0xF6,
            set: function(str){
                let res = /(\d{1,2})x(\d{1,2})/.exec(str);
                return (Number(res[1]) << 4) | (Number(res[2]))},
            get: function(val){return `${val >> 4}x${val & 0b00001111}`}
        },
        {name: 'SNo', min: 0, max: 100} //ordinal number in the wall. 'Z' numbering scheme. Upper left is 1
    ]},

    //Model Name Control
    //Read display model name
    {name: 'model', cmd: 0x8A, mode: 'r'},

    //Fan Control
    {name: 'fan', cmd: 0x8F, mode: 'rw', value: {dic: [['manual', 0], ['auto', 1], ['off', 2], ['on', 3]]}},

    //Auto Source Switch Control
    {name: 'autoSource', cmd: 0xCA, sub: 0x82, mode: 'rw', value: [
        {name: 'recovery', dic: [['on', 1], ['off', 0]]},
        {name: 'primary', dic: inputs},
        {name: 'secondery', dic: inputs}
    ]}
]

module.exports = commands;