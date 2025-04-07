// Load osu! api
let osuApi
async function getApi() {
    const response = await fetch("../_data/osu-api.json")
    const responseJson = await response.json()
    osuApi = responseJson.api
}

let allBeatmapsJson = []
let fullJson = []

async function getBeatmaps() {
    const response = await fetch("../_data/beatmaps-base.json")
    const responseJson = await response.json()
    allBeatmaps = responseJson.beatmaps

    for (let i = 0; i < allBeatmaps.length; i++) {
        // Set mod number
        let modNumber = 0
        if (allBeatmaps[i].mod === "HR") modNumber = 16
        else if (allBeatmaps[i].mod === "DT") modNumber = 64
        
        // Get API response
        const response = await fetch(`https://api.codetabs.com/v1/proxy?quest=` + encodeURIComponent(`https://osu.ppy.sh/api/get_beatmaps?k=${osuApi}&b=${allBeatmaps[i].beatmap_id}&mods=${modNumber}`))
        await delay(1000)
        let responseJson = await response.json()
        responseJson[0].mod = allBeatmaps[i].mod
        responseJson[0].order = allBeatmaps[i].order
        if (allBeatmaps[i].EZMulti) {
            responseJson[0].EZMulti = allBeatmaps[i].EZMulti
            responseJson[0].EZHDMulti = allBeatmaps[i].EZHDMulti
        }
        
        allBeatmapsJson.push(responseJson[0])

        console.log(allBeatmapsJson)
    }

    fullJson = {
        "roundName": responseJson.roundName,
        "beatmaps": allBeatmapsJson
    }

    const jsonString = JSON.stringify(fullJson, null, 4)
    const blob = new Blob([jsonString], { type: "application/json" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "beatmaps.json"
    link.click()
}

async function initialise() {
    await getApi()
    await getBeatmaps()
}
initialise()