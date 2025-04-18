// Load osu! api
let osuApi
async function getApi() {
    const response = await fetch("../_data/osu-api.json")
    const responseJson = await response.json()
    osuApi = responseJson.api
}

// Find Team 
const findTeam = teamName => allTeams.find(team => team.country_name.toUpperCase() == teamName.toUpperCase())

// Get beatmaps
let currentBestOf = 0, currentFirstTo = 0, currentLeftStars = 0, currentRightStars = 0
let allBeatmaps, currentMappoolBeatmap
let mapId, mapChecksum
async function getBeatmaps() {
    const response = await fetch("../_data/beatmaps.json")
    const responseJson = await response.json()
    allBeatmaps = responseJson.beatmaps

    switch (responseJson.roundName) {
        case "ROUND OF 32": case "ROUND OF 16":
            currentBestOf = 9; break;
        case "QUARTERFINALS": case "SEMIFINALS":
            currentBestOf = 11; break;
        case "FINALS": case "GRAND FINALS":
            currentBestOf = 13; break;
    }
    currentFirstTo = Math.ceil(currentBestOf / 2)

    createStarDisplay()
}

// Find Beatmaps
const findBeatmap = beatmapId => allBeatmaps.find(beatmap => beatmap.beatmap_id == beatmapId)

// Toggle stars
let isStarOn = true
function toggleStars() {
    isStarOn = !isStarOn
    if (isStarOn) {
        leftTeamStarContainerEl.style.display = "flex"
        rightTeamStarContainerEl.style.display = "flex"
    } else {
        leftTeamStarContainerEl.style.display = "none"
        rightTeamStarContainerEl.style.display = "none"
    }
}

let allTeams
async function initialise() {
    await getApi()
    allTeams = await getTeams()
    await getBeatmaps()
}
initialise()

// Team Name
const leftTeamNameEl = document.getElementById("left-team-name")
const rightTeamNameEl = document.getElementById("right-team-name")
// Team Flags
const leftFlagEl = document.getElementById("left-flag")
const rightFlagEl = document.getElementById("right-flag")
// Variables
let currentLeftTeamName, currentRightTeamName

// Create socket
const socket = createTosuWsSocket()

// Bottom SectionF
const scoreSectionEl = document.getElementById("score-section")
// Score bar
const leftScoreBarEl = document.getElementById("left-score-bar")
const rightScoreBarEl = document.getElementById("right-score-bar")
// Scores
const leftScoreEl = document.getElementById("left-score")
const rightScoreEl = document.getElementById("right-score")
// Score differences
const leftScoreDifferenceEl = document.getElementById("left-score-difference")
const rightScoreDifferenceEl = document.getElementById("right-score-difference")
// Variabels
let currentLeftTeamScore, currentRightTeamScore, currentScoreDelta
//
const animation = {
    "leftScore": new CountUp(leftScoreEl, 0, 0, 0, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: "." }),
    "rightScore": new CountUp(rightScoreEl, 0, 0, 0, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: "." }),
    "leftScoreDifference": new CountUp(leftScoreDifferenceEl, 0, 0, 0, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: ".", prefix: "(", suffix: ")" }),
    "rightScoreDifference": new CountUp(rightScoreDifferenceEl, 0, 0, 0, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: ".", prefix: "(", suffix: ")" })
}

// Score visibility
let scoreVisible

// Chat Display
const chatDisplayEl = document.getElementById("chat-display")
const chatDisplayContainerEl = document.getElementById("chat-display-container")
let chatLen

// Now Playing Section
const nowPlayingSection = document.getElementById("now-playing-section")
const nowPlayingSectionStats = document.getElementById("now-playing-section-stats")
const nowPlayingStatsBackgroundEl = document.getElementById("now-playing-stats-background")
// Now Playing Stats Metadata
const nowPlayingStatsTitleEl = document.getElementById("now-playing-stats-title")
const nowPlayingStatsMapperEl = document.getElementById("now-playing-stats-mapper")
const nowPlayingstatsDifficultyEl = document.getElementById("now-playing-stats-difficulty")
// Now Playing Stats
const nowPlayingStatsCsEl = document.getElementById("now-playing-stats-cs")
const nowPlayingStatsArEl = document.getElementById("now-playing-stats-ar")
const nowPlayingStatsOdEl = document.getElementById("now-playing-stats-od")
const nowPlayingStatsSrEl = document.getElementById("now-playing-stats-sr")
const nowPlayingStatsLengthEl = document.getElementById("now-playing-stats-length")
const nowPlayingStatsBpmEl = document.getElementById("now-playing-stats-bpm")

// Socket message
socket.onmessage = event => {
    const data = JSON.parse(event.data)
    console.log(data)

    // Team Names
    if (currentLeftTeamName != data.tourney.team.left && allTeams) {
        currentLeftTeamName = data.tourney.team.left
        leftTeamNameEl.innerText = currentLeftTeamName.toUpperCase()

        const team = findTeam(currentLeftTeamName)
        if (team) leftFlagEl.style.background = `url("${team.imageUrl}`
        else leftFlagEl.style.background = `url()`
    }
    if (currentRightTeamName != data.tourney.team.right && allTeams) {
        currentRightTeamName = data.tourney.team.right
        rightTeamNameEl.innerText = currentRightTeamName.toUpperCase()

        const team = findTeam(currentRightTeamName)
        if (team) rightFlagEl.style.background = `url("${team.imageUrl}`
        else rightFlagEl.style.background = `url()`
    }

    // Beatmap checking
    if (mapId !== data.beatmap.id || mapChecksum !== data.beatmap.checksum && allBeatmaps) {
        mapId = data.beatmap.id
        mapChecksum = data.beatmap.checksum
        currentMappoolBeatmap = undefined

        // Set metadata stuff
        nowPlayingStatsBackgroundEl.style.backgroundImage = `url("https://assets.ppy.sh/beatmaps/${data.beatmap.set}/covers/cover.jpg")`
        nowPlayingStatsTitleEl.innerText = `${data.beatmap.artist} - ${data.beatmap.title}`
        nowPlayingStatsMapperEl.innerText = data.beatmap.mapper
        nowPlayingstatsDifficultyEl.innerText = data.beatmap.version

        currentMappoolBeatmap = findBeatmap(mapId)

        if (currentMappoolBeatmap) {
            let currentSr = Math.round(Number(currentMappoolBeatmap.difficultyrating) * 100) / 100
            let currentCs = Math.round(Number(currentMappoolBeatmap.diff_size) * 10) / 10
            let currentAr = Math.round(Number(currentMappoolBeatmap.diff_approach) * 10) / 10
            let currentOd = Math.round(Number(currentMappoolBeatmap.diff_overall) * 10) / 10
            let currentBpm = Number(currentMappoolBeatmap.bpm)
            let currentLength = Number(currentMappoolBeatmap.hit_length)
            nowPlayingStatsSrEl.innerText = currentSr
            switch (currentMappoolBeatmap.mod) {
                case "HR":
                    currentCs = Math.min(Math.round(Number(currentMappoolBeatmap.diff_size) * 1.3 * 10) / 10, 10)
                    currentAr = Math.min(Math.round(Number(currentMappoolBeatmap.diff_approach) * 1.4 * 10) / 10, 10)
                    currentOd = Math.min(Math.round(Number(currentMappoolBeatmap.diff_overall) * 1.4 * 10) / 10, 10)
                    break
                case "DT":
                    if (currentAr > 5) currentAr = Math.round((((1200 - (( 1200 - (currentAr - 5) * 150) * 2 / 3)) / 150) + 5) * 10) / 10
                    else currentAr = Math.round((1800 - ((1800 - currentAr * 120) * 2 / 3)) / 120 * 10) / 10
                    currentOd = Math.round((79.5 - (( 79.5 - 6 * currentOd) * 2 / 3)) / 6 * 10) / 10
                    currentBpm = Math.round(currentBpm * 1.5)
                    currentLength = Math.round(currentLength / 1.5)
                    break
            }
            nowPlayingStatsCsEl.innerText = currentCs
            nowPlayingStatsArEl.innerText = currentAr
            nowPlayingStatsOdEl.innerText = currentOd
            nowPlayingStatsBpmEl.innerText = currentBpm

            // Display length correctly
            displayLength(currentLength)
            
        } else {
            delay(250)
        }
    }

    // If no beatmap
    if (!currentMappoolBeatmap) {
        nowPlayingStatsCsEl.innerText = data.beatmap.stats.cs.converted
        nowPlayingStatsArEl.innerText = data.beatmap.stats.ar.converted
        nowPlayingStatsOdEl.innerText = data.beatmap.stats.od.converted
        nowPlayingStatsSrEl.innerText = data.beatmap.stats.stars.total
        nowPlayingStatsBpmEl.innerText = data.beatmap.stats.bpm.common
        displayLength(Math.round((data.beatmap.time.lastObject - data.beatmap.time.firstObject) / 1000))
    }

    // Set score visibility
    if (scoreVisible !== data.tourney.scoreVisible) {
        scoreVisible = data.tourney.scoreVisible
        if (scoreVisible) {
            scoreSectionEl.style.opacity = 1
            chatDisplayEl.style.opacity = 0

            nowPlayingSection.style.width = "1820px"
            nowPlayingSectionStats.style.width = "1365px"
            nowPlayingStatsBackgroundEl.style.width = "800px"
        } else {
            scoreSectionEl.style.opacity = 0
            chatDisplayEl.style.opacity = 1

            nowPlayingSection.style.width = "550px"
            nowPlayingSectionStats.style.width = "550px"
            nowPlayingStatsBackgroundEl.style.width = "550px"
        }
    }

    // Set scores
    if (scoreVisible) {
        currentLeftTeamScore = 0
        currentRightTeamScore = 0
        currentScoreDelta = 0
        
        for (let i = 0; i < data.tourney.clients.length; i++) {
            const currentPlayer = data.tourney.clients[i]
            let currentScore = currentPlayer.play.score            
            // Check for EZ, EZHD, and multiplier
            if (currentMappoolBeatmap && currentMappoolBeatmap.mod === "FM") {
                const mods = getMods(currentPlayer.play.mods.number)
                if (mods.includes("EZ") && mods.includes("HD")) currentScore *= currentMappoolBeatmap.EZHDMulti
                else if (mods.includes("EZ")) currentScore *= currentMappoolBeatmap.EZMulti
            }

            // Add score to correct team
            if (currentPlayer.team === "left") currentLeftTeamScore += currentScore
            else if (currentPlayer.team === "right") currentRightTeamScore += currentScore
        }

        // Set animation
        animation.leftScore.update(currentLeftTeamScore)
        animation.rightScore.update(currentRightTeamScore)

        currentScoreDelta = Math.abs(currentLeftTeamScore - currentRightTeamScore)
        const barWidth = Math.min(Math.pow(currentScoreDelta / 1000000, 0.5) * 600, 600)

        animation.leftScoreDifference.update(currentLeftTeamScore - currentRightTeamScore)
        animation.rightScoreDifference.update(currentRightTeamScore - currentLeftTeamScore)

        if (currentLeftTeamScore > currentRightTeamScore) {
            // Set details for score themselves
            leftScoreEl.classList.add("leading-score")
            rightScoreEl.classList.remove("leading-score")

            // Set details for bar
            leftScoreBarEl.style.width = `${barWidth}px`
            rightScoreBarEl.style.width = "0px"

            // Set score difference
            leftScoreDifferenceEl.style.display = "none"
            rightScoreDifferenceEl.style.display = "block"
        } else if (currentLeftTeamScore === currentRightTeamScore) {
            // Set details for score themselves
            leftScoreEl.classList.remove("leading-score")
            rightScoreEl.classList.remove("leading-score")

            // Set details for bar
            leftScoreBarEl.style.width = "0px"
            rightScoreBarEl.style.width = "0px"

            // Set score difference
            leftScoreDifferenceEl.style.display = "none"
            rightScoreDifferenceEl.style.display = "none"
        } else if (currentLeftTeamScore < currentRightTeamScore) {
            // Set details for score themselves
            leftScoreEl.classList.remove("leading-score")
            rightScoreEl.classList.add("leading-score")

            // Set details for bar
            leftScoreBarEl.style.width = "0px"
            rightScoreBarEl.style.width = `${barWidth}px`

            // Set score difference
            leftScoreDifferenceEl.style.display = "block"
            rightScoreDifferenceEl.style.display = "none"
        }
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
}

// Display length
function displayLength(second) {
    const minutes = Math.floor(second / 60)
    const seconds = second % 60
    nowPlayingStatsLengthEl.innerText = `${minutes < 10? minutes.toString().padStart(2, "0") : minutes}:${seconds < 10? seconds.toString().padStart(2, "0") : seconds}`
}

// Picker Colour
let pickerColour
setInterval(() => {
    const currentPickerColour = getCookie("currentTeamPick")
    if (currentMappoolBeatmap && currentMappoolBeatmap.mod === "TB") {
        nowPlayingSection.style.borderColor = `var(--green)`
    } else if (currentMappoolBeatmap && currentPickerColour !== pickerColour) {
        pickerColour = currentPickerColour
        nowPlayingSection.style.borderColor = `var(--${pickerColour})`        
    } else if (!currentMappoolBeatmap) {
        document.cookie = `currentTeamPick=none; path=/`
    }

    // Get stars
    currentLeftStars = Number(getCookie("currentLeftStars"))
    currentRightStars = Number(getCookie("currentRightStars"))

    createStarDisplay()

    // Toggle Stars
    const isStarOn = getCookie("toggleStars")
    if (isStarOn === "true") {
        leftTeamStarContainerEl.style.display = "flex"
        rightTeamStarContainerEl.style.display = "flex"
    } else if (isStarOn === "false") {
        leftTeamStarContainerEl.style.display = "none"
        rightTeamStarContainerEl.style.display = "none"
    }
}, 200)

// Create Star Display
const leftTeamStarContainerEl = document.getElementById("left-team-star-container")
const rightTeamStarContainerEl = document.getElementById("right-team-star-container")
function createStarDisplay() {
    leftTeamStarContainerEl.innerHTML = ""
    rightTeamStarContainerEl.innerHTML = ""

    let i = 0
    for (i; i < currentLeftStars; i++) leftTeamStarContainerEl.append(createStar("full"))
    for (i; i < currentFirstTo; i++) leftTeamStarContainerEl.append(createStar("empty"))

    i = 0
    for (i; i < currentRightStars; i++) rightTeamStarContainerEl.append(createStar("full"))
    for (i; i < currentFirstTo; i++) rightTeamStarContainerEl.append(createStar("empty"))

    // Create Star
    function createStar(status) {
        const newStar = document.createElement("img")
        newStar.classList.add("team-stard")
        newStar.setAttribute("src", `static/star-${status}.png`)
        return newStar
    }
}