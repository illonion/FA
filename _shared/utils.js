function registerSocketEventLoggers(socket) {
    socket.onopen = () => { console.log('Successfully Connected'); };
    socket.onclose = event => { console.log('Socket Closed Connection: ', event); socket.send('Client Closed!'); };
    socket.onerror = error => { console.log('Socket Error: ', error); };
}

function createTosuWsSocket(path = "/websocket/v2") {
    let socket = new ReconnectingWebSocket('ws://' + location.host + path);
    registerSocketEventLoggers(socket);
    return socket;
}

const delay = async time => new Promise(resolve => setTimeout(resolve, time));

// Get Cookie
function getCookie(cname) {
    let name = cname + "="
    let ca = document.cookie.split(';')
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i]
        while (c.charAt(0) == ' ') c = c.substring(1)
        if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
    }
    return "";
}

async function getTeams() {
    const response = await fetch("../_data/teams.json")
    const responseJson = await response.json()
    let allTeams = responseJson
    return allTeams
}

function getMods(modNumber) {
    const mods = {
        0: "",
        1: "NF",
        2: "EZ",
        4: "TD",
        8: "HD",
        16: "HR",
        32: "SD",
        64: "DT",
        128: "RE",
        256: "HT",
        512: "NC",
        1024: "FL",
        2048: "AP",
        4096: "SO",
        8192: "R2",
        16384: "PF"
    }
  
    // Extract the mod names
    const enabledMods = Object.entries(mods)
        .filter(([value, name]) => modNumber & value)
        .map(([value, name]) => name)

    return enabledMods
}