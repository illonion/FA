// Find Team 
const findTeam = teamName => allTeams.find(team => team.teamName.toUpperCase() == teamName.toUpperCase())

let allTeams
async function initialise() {
    allTeams = await getTeams()
    await getBeatmaps()
}
initialise()

const mappoolContainerEl = document.getElementById("mappool-container")
let currentBestOf = 0, currentFirstTo = 0, currentLeftStars = 0, currentRightStars = 0
let allBeatmaps, roundName
async function getBeatmaps() {
    const response = await fetch("../_data/beatmaps.json")
    const responseJson = await response.json()
    allBeatmaps = responseJson.beatmaps
    
    roundName = responseJson.roundName
    currentBestOf = 13
    switch (roundName) {
        case "ROUND OF 32": case "ROUND OF 16":
            currentBestOf = 9
            break
        case "QUARTERFINALS": case "SEMIFINALS":
            currentBestOf = 11
            break
    }
    currentFirstTo = Math.ceil(currentBestOf / 2)

    createStarDisplay()
    
    for (let i = 0; i < allBeatmaps.length; i++) {
        const mapWrapper = document.createElement("div")
        mapWrapper.classList.add("map-wrapper")
        mapWrapper.style.backgroundImage = `url("https://assets.ppy.sh/beatmaps/${allBeatmaps[i].beatmapset_id}/covers/cover.jpg")`
        mapWrapper.setAttribute("id", allBeatmaps[i].beatmap_id)
        mapWrapper.addEventListener("mousedown", mapClickEvent)
        mapWrapper.addEventListener("contextmenu", event => event.preventDefault())
        mapWrapper.dataset.id = allBeatmaps[i].beatmap_id
        mapWrapper.dataset.pickTeam = "false"
        mapWrapper.dataset.banTeam = "false"

        const mapOverlay = document.createElement("div")
        mapOverlay.classList.add("map-overlay")

        const mapTitle = document.createElement("div")
        mapTitle.classList.add("map-title")
        mapTitle.innerText = `${allBeatmaps[i].artist} - ${allBeatmaps[i].title}`

        const mapBottomRow = document.createElement("div")
        mapBottomRow.classList.add("map-bottom-row")

        const mapMapperText = document.createElement("span")
        mapMapperText.classList.add("map-mapper-text")
        mapMapperText.innerText = "mapper"

        const mapMapperName = document.createElement("span")
        mapMapperName.classList.add("map-mapper-name")
        mapMapperName.innerText = allBeatmaps[i].creator

        const mapDifficultyText = document.createElement("span")
        mapDifficultyText.classList.add("map-difficulty-text")
        mapDifficultyText.innerText = "difficulty"

        const mapDifficultyName = document.createElement("span")
        mapDifficultyName.classList.add("map-difficulty-name")
        mapDifficultyName.innerText = allBeatmaps[i].version

        const mapModIcon = document.createElement("div")
        mapModIcon.classList.add("map-mod-icon")
        if (allBeatmaps[i].mod.includes("EZ") && allBeatmaps[i].mod.includes("DT")) {
            const span1 = document.createElement("span")
            span1.classList.add("map-mod-icon-ez")
            span1.innerText = "EZ"
            const span2 = document.createElement("span")
            span2.classList.add("map-mod-icon-dt")
            span2.innerText = "DT"
            mapModIcon.append(span1, span2)
        } else {
            mapModIcon.classList.add(`map-mod-icon-${allBeatmaps[i].mod.toLowerCase()}`)
            mapModIcon.innerText = allBeatmaps[i].mod
        }

        const mapActionBase = document.createElement("div")
        mapActionBase.classList.add("map-action-base")

        const mapActionOverlay = document.createElement("div")
        mapActionOverlay.classList.add("map-action-overlay")

        const mapModOverallOverlay = document.createElement("div")
        mapModOverallOverlay.classList.add("map-mod-overall-overlay")

        mapBottomRow.append(mapMapperText, mapMapperName, mapDifficultyText, mapDifficultyName)
        mapWrapper.append(mapOverlay, mapTitle, mapBottomRow, mapModIcon, mapActionBase, mapActionOverlay, mapModOverallOverlay)
        mappoolContainerEl.append(mapWrapper)
    }
}

// Find beatmap from beatmapId
const findBeatmapFromBeatmapId = beatmapId => allBeatmaps.find(beatmap => beatmap.beatmap_id === beatmapId)

// Create Star Display
const leftTeamStarContainerEl = document.getElementById("left-team-star-container")
const rightTeamStarContainerEl = document.getElementById("right-team-star-container")
function createStarDisplay() {
    leftTeamStarContainerEl.innerHTML = ""
    rightTeamStarContainerEl.innerHTML = ""

    let i = 0
    for (i; i < currentLeftStars; i++) leftTeamStarContainerEl.append(createStar("fill"))
    for (i; i < currentFirstTo; i++) leftTeamStarContainerEl.append(createStar("empty"))

    i = 0
    for (i; i < currentRightStars; i++) rightTeamStarContainerEl.append(createStar("fill"))
    for (i; i < currentFirstTo; i++) rightTeamStarContainerEl.append(createStar("empty"))

    // Create Star
    function createStar(status) {
        const newStar = document.createElement("img")
        newStar.classList.add("team-star")
        newStar.setAttribute("src", `../_shared/assets/star-${status}.png`)
        return newStar
    }

    document.cookie = `currentLeftStars=${currentLeftStars}; path=/`
    document.cookie = `currentRightStars=${currentRightStars}; path=/`
}

// Map Click Event
function mapClickEvent(event) {
    // Find map
    const currentMapId = this.dataset.id
    const currentMap = findBeatmapFromBeatmapId(currentMapId)
    if (!currentMap) return

    // Team
    let team
    if (event.button === 0) team = "red"
    else if (event.button === 2) team = "blue"
    if (!team) return

    // Action
    let action = "pick"
    if (event.ctrlKey) action = "ban"
    if (event.shiftKey) action = "reset"

    // Tierbeaker?
    let tiebreaker = false
    if (event.altKey) tiebreaker = true

    // Reset Map Action Base
    const mapActionBase = this.children[4]
    mapActionBase.classList.remove("map-action-pick-animation")
    mapActionBase.classList.remove("map-action-ban-animation")
    void mapActionBase.offsetWidth

    if (action === "ban") {
        // Set animation
        mapActionBase.classList.add("map-action-ban-animation")
        setTimeout(() => { 
            mapActionBase.classList.remove("map-action-pick-animation")
            mapActionBase.classList.remove("map-action-ban-animation")
        }, 5000)

        // Map Action Overlay
        this.children[5].style.boxShadow = `inset 0 0 0 5px ${team}`
        this.children[5].style.opacity = 1

        // Map Mod Overall Overlay
        this.children[6].style.opacity = 1

        this.dataset.pickTeam = "false"
        this.dataset.banTeam = "true"
    } else if (action === "pick") {
        // Set animation
        mapActionBase.classList.add("map-action-pick-animation")
        setTimeout(() => { 
            mapActionBase.classList.remove("map-action-pick-animation")
            mapActionBase.classList.remove("map-action-ban-animation")
        }, 5000)

        // Map Action Overlay
        this.children[5].style.opacity = 1
        if (tiebreaker) this.children[5].style.boxShadow = `inset 0 0 0 5px var(--pink)`
        else this.children[5].style.boxShadow = `inset 0 0 0 5px ${team}`
        
        if (tiebreaker) document.cookie = `currentPicker=tiebreaker; path=/`
        else document.cookie = `currentPicker=${team}; path=/`

        this.dataset.pickTeam = "true"
        this.dataset.banTeam = "false"
    } else if (action === "reset") {
        this.children[4].style.opacity = 0
        this.children[5].style.opacity = 0
        this.children[6].style.opacity = 0
        
        this.dataset.pickTeam = "false"
        this.dataset.banTeam = "false"
    }
}

// Team Name
const leftTeamNameEl = document.getElementById("left-team-name")
const rightTeamNameEl = document.getElementById("right-team-name")
let currentLeftTeamName, currentRightTeamName
// Team Flags
const leftFlagEl = document.getElementById("left-flag")
const rightFlagEl = document.getElementById("right-flag")

// Chat Display
const chatDisplayEl = document.getElementById("chat-display")
const chatDisplayContainerEl = document.getElementById("chat-display-container")
let chatLen

// Scores
let currentLeftTeamScore, currentRightTeamScore, ipcState, checkedWinner = false,scoreVisible

// Map info
let mapChecksum, mapId, mappoolMap

// Create socket
const socket = createTosuWsSocket()
// Socket message
socket.onmessage = event => {
    const data = JSON.parse(event.data)
    console.log(data)

    // Team Names
    if (currentLeftTeamName != data.tourney.team.left && allTeams) {
        currentLeftTeamName = data.tourney.team.left
        leftTeamNameEl.innerText = currentLeftTeamName.toUpperCase()

        const team = findTeam(currentLeftTeamName)
        if (team && team.imageUrl !== "https://i.imgur.com/NSCK2vS.jpeg") leftFlagEl.style.backgroundImage = `url("https://api.codetabs.com/v1/proxy?quest=${team.imageUrl}")`
        else if (team) leftFlagEl.style.backgroundImage = `url("../_shared/assets/team-banner/imgur-team-banner.jpeg`
        else leftFlagEl.style.backgroundImage = `url()`
    }
    if (currentRightTeamName != data.tourney.team.right && allTeams) {
        currentRightTeamName = data.tourney.team.right
        rightTeamNameEl.innerText = currentRightTeamName.toUpperCase()

        const team = findTeam(currentRightTeamName)
        if (team && team.imageUrl !== "https://i.imgur.com/NSCK2vS.jpeg") rightFlagEl.style.backgroundImage = `url("https://api.codetabs.com/v1/proxy?quest=${team.imageUrl}")`
        else if (team) rightFlagEl.style.backgroundImage = `url("../_shared/assets/team-banner/imgur-team-banner.jpeg`
        else rightFlagEl.style.backgroundImage = `url()`
    }

    // This is also mostly taken from Victim Crasher: https://github.com/VictimCrasher/static/tree/master/WaveTournament
    if (chatLen !== data.tourney.chat.length) {
        (chatLen === 0 || chatLen > data.tourney.chat.length) ? (chatDisplayContainerEl.innerHTML = "", chatLen = 0) : null
        const fragment = document.createDocumentFragment()

        for (let i = chatLen; i < data.tourney.chat.length; i++) {
            const chatColour = data.tourney.chat[i].team

            // Chat message container
            const chatMessageContainer = document.createElement("div")
            chatMessageContainer.classList.add("message-container")

            // Time
            const chatDisplayTime = document.createElement("div")
            chatDisplayTime.classList.add("message-time")
            chatDisplayTime.innerText = data.tourney.chat[i].timestamp

            // Whole Message
            const chatDisplayWholeMessage = document.createElement("div")
            chatDisplayWholeMessage.classList.add("message-wrapper")  

            // Name
            const chatDisplayName = document.createElement("span")
            chatDisplayName.classList.add("message-name")
            chatDisplayName.classList.add(chatColour)
            chatDisplayName.innerText = data.tourney.chat[i].name + ": ";

            // Message
            const chatDisplayMessage = document.createElement("span")
            chatDisplayMessage.classList.add("message-content")
            chatDisplayMessage.innerText = data.tourney.chat[i].message

            chatDisplayWholeMessage.append(chatDisplayName, chatDisplayMessage)
            chatMessageContainer.append(chatDisplayTime, chatDisplayWholeMessage)
            fragment.append(chatMessageContainer)
        }

        chatDisplayContainerEl.append(fragment)
        chatLen = data.tourney.chat.length
        chatDisplayContainerEl.scrollTop = chatDisplayContainerEl.scrollHeight
    }

    // Check score visibility
    if (scoreVisible !== data.tourney.scoreVisible) {
        scoreVisible = data.tourney.scoreVisible
    }

    // Set scores
    if (scoreVisible) {
        currentLeftTeamScore = 0
        currentRightTeamScore = 0
        
        for (let i = 0; i < data.tourney.clients.length; i++) {
            const currentPlayer = data.tourney.clients[i]
            let currentScore = currentPlayer.play.score            
            // Check for EZ, FL, and EZFL Multi
            if (mappoolMap && (mappoolMap.mod.includes("FM") || mappoolMap.mod.includes("FCM"))) {
                const mods = getMods(currentPlayer.play.mods.number)
                if (mods.includes("EZ") && mods.includes("FL")) currentScore *= 2.5
                else if (mods.includes("EZ")) currentScore *= mappoolMap.EZMulti
                else if (mods.includes("FL")) currentScore *= 1.4
            }

            // Add score to correct team
            if (currentPlayer.team === "left") currentLeftTeamScore += currentScore
            else if (currentPlayer.team === "right") currentRightTeamScore += currentScore
        }
    }

    if (ipcState !== data.tourney.ipcState) {
        ipcState = data.tourney.ipcState

        if (ipcState === 4 && !checkedWinner) {
            if (currentLeftTeamScore > currentRightTeamScore) updateStarCount('red', 'plus')
            else if (currentRightTeamScore > currentLeftTeamScore) updateStarCount('blue', 'plus')

            if (currentLeftStars === currentRightStars && currentLeftStars === currentFirstTo - 1) updateNextAutoPicker("tiebreaker")
        } else if (ipcState !== 4) {
            checkedWinner = false
        }
    }

    if (mapId !== data.beatmap.id || mapChecksum !== data.beatmap.checksum) {
        mapId = data.beatmap.id
        mapChecksum = data.beatmap.checksum

        const currentMap = document.getElementById(mapId)
        mappoolMap = findBeatmapFromBeatmapId(mapId.toString())

        if (currentMap && currentMap.dataset.pickTeam === "false" && currentMap.dataset.banTeam === "false" && isAutopickOn) {
            const event = new MouseEvent('mousedown', {
                bubbles: true,
                cancelable: true,
                view: window,
                button: (nextPicker === "blue")? 2 : 0,
                altKey: (nextPicker === "tiebreaker")? true : false
            })
            currentMap.dispatchEvent(event)

            if (nextPicker === "red") updateNextAutoPicker("blue")
            else if (nextPicker === "blue") updateNextAutoPicker("red")
        }
    }
}

// Toggle Stars
const toggleStarsEl = document.getElementById("toggle-stars")
let isStarOn = true
function toggleStars() {
    isStarOn = !isStarOn
    if (isStarOn) {
        leftTeamStarContainerEl.style.display = "flex"
        rightTeamStarContainerEl.style.display = "flex"
        toggleStarsEl.innerText = "Toggle Stars: ON"
    } else {
        leftTeamStarContainerEl.style.display = "none"
        rightTeamStarContainerEl.style.display = "none"
        toggleStarsEl.innerText = "Toggle Stars: OFF"
    }
    document.cookie = `toggleStars=${isStarOn}; path=/`
}
document.cookie = `toggleStars=${isStarOn}; path=/`

// Update star count
function updateStarCount(side, action) {
    if (!isStarOn) return

    if (side === "red" && action === "plus") currentLeftStars++
    else if (side === "blue" && action === "plus") currentRightStars++
    else if (side === "red" && action === "minus") currentLeftStars--
    else if (side === "blue" && action === "minus") currentRightStars--

    if (currentLeftStars > currentFirstTo) currentLeftStars = currentFirstTo
    else if (currentLeftStars < 0) currentLeftStars = 0
    if (currentRightStars > currentFirstTo) currentRightStars = currentFirstTo
    else if (currentRightStars < 0) currentRightStars = 0

    createStarDisplay()
}

// Toggle autopick
const toggleAutopickEl = document.getElementById("toggle-autopick")
let isAutopickOn = false
function toggleAutopick() {
    isAutopickOn = !isAutopickOn
    toggleAutopickEl.innerText = `Toggle Autopick: ${isAutopickOn? "ON" : "OFF"}`
}

// Next Autopicker
const nextAutopickerEl = document.getElementById("next-auto-picker-team")
let nextPicker
function updateNextAutoPicker(team) {
    nextAutopickerEl.innerText = team.slice(0, 1).toUpperCase() + team.slice(1)
    nextPicker = team
}