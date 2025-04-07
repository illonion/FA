// Get beatmaps
const beatmapMapScrollMainEl = document.getElementById("beatmap-map-scroll-main")
const allMapSlots = beatmapMapScrollMainEl.children
let allBeatmaps
async function getBeatmaps() {
    const response = await fetch("../_data/showcase-beatmaps.json")
    const responseJson = await response.json()
    allBeatmaps = responseJson.beatmaps    
    

    for (let i = 0; i < allBeatmaps.length; i++) {
        const newMapTitle = document.createElement("div")
        const newSongName = allBeatmaps[i].songName
        const newSongDifficulty = allBeatmaps[i].difficultyName
        newMapTitle.setAttribute("id", `${newSongName}_${newSongDifficulty}`)
        if (allBeatmaps[i].modId.toUpperCase().includes("TB")) newMapTitle.innerText = "TB"
        else newMapTitle.innerText = allBeatmaps[i].modId.toUpperCase()
        
        if (i == 0) newMapTitle.classList.add("map-slide-current")
        else if (i == 1) newMapTitle.classList.add("map-slide-right", "map-slide-left-right")
        else newMapTitle.classList.add("map-slide-invisible", "map-slide-invisible-right")
        beatmapMapScrollMainEl.append(newMapTitle)
    }
}
getBeatmaps()

// Create socket
const socket = createTosuWsSocket()

// Replayer name
const replayerNameEl = document.getElementById("replayer-name")
let replayerName

// Beatmap metadata section
const beatmapMetadataSectionEl = document.getElementById("beatmap-metadata-section")
const songTitleEl = document.getElementById("song-title")
const songDifficultyEl = document.getElementById("song-difficulty")
const songMapperEl = document.getElementById("song-mapper")
let mapId, updateStats = false

// Map slot information
let currentMapSlot = 0
let previousToMapSlot
let toMapSlot = 0
let mapSlotDifference = 0
let animTime
const directions = ["invisible-left", "extreme-left", "left", "current", "right", "invisible-right"]

// Strains
const progressChart = document.getElementById("progress")
let tempStrains, seek, fullTime
let changeStats = false
let statsCheck = false
let last_strain_update = 0

window.onload = function () {
	let ctx = document.getElementById('strain').getContext('2d')
	window.strainGraph = new Chart(ctx, config)

	let ctxProgress = document.getElementById('strain-progress').getContext('2d')
	window.strainGraphProgress = new Chart(ctxProgress, configProgress)
}


// Beatmap stats
const starRatingNumberEl = document.getElementById("star-rating-number")
const circleSizeNumberEl = document.getElementById("circle-size-number")
const approachRateNumberEl = document.getElementById("approach-rate-number")
const overallDifficultyNumberEl = document.getElementById("overall-difficulty-number")
const bpmNumberEl = document.getElementById("bpm-number")
const lengthnumberEl = document.getElementById("length-number")

socket.onmessage = async event => {
    const data = JSON.parse(event.data)

    // Replayer name
    if (replayerName !== data.resultsScreen.playerName && data.resultsScreen.playerName !== "") {
        replayerName = data.resultsScreen.playerName
        replayerNameEl.innerText = replayerName
    }

    // Beatmap metadata section
    if (mapId !== data.beatmap.id) {
        mapId = data.beatmap.id

        // Update metadata
        beatmapMetadataSectionEl.style.backgroundImage = `url("https://assets.ppy.sh/beatmaps/${data.beatmap.set}/covers/cover.jpg")`

        songTitleEl.innerText = `${data.beatmap.artist} - ${data.beatmap.title}`
        songDifficultyEl.innerText = `[${data.beatmap.version}]`
        songMapperEl.innerText = data.beatmap.mapper

        nowPlayingDetailTextSlide(songTitleEl)
        nowPlayingDetailTextSlide(songDifficultyEl)
        nowPlayingDetailTextSlide(songMapperEl)

        // Update "toMapSlot"
        previousToMapSlot = toMapSlot
        toMapSlot = allBeatmaps.findIndex(beatmap => beatmap.songName === data.beatmap.title && beatmap.difficultyName === data.beatmap.version)
        if (toMapSlot === -1) toMapSlot = previousToMapSlot

        // Calculate difference between number of slots
        mapSlotDifference = Math.abs(currentMapSlot - toMapSlot)

        // Moving to next maps in carousel
        function animateMapSlot(searchMap, classesToRemove, classesToAdd) {
            if (document.body.contains(searchMap)) {
                searchMap.classList.remove(classesToRemove)
                classesToAdd.forEach(classAdd => searchMap.classList.add(classAdd))
                searchMap.style.animationDuration = `${animTime}ms`
            }
        }

        if (currentMapSlot < toMapSlot) {
            for (let i = 0; i < mapSlotDifference; i++) {
                removeAnimationClasses()
                animTime = Math.round(1000 / Math.abs(currentMapSlot - toMapSlot))

                for (let j = -2; j <= 2; j++) {
                    const searchMap = allMapSlots[currentMapSlot + j]
                    const fromClass = `map-slide-${directions[j + 3]}`
                    const toClasses = [`from-${directions[j + 3]}-to-${directions[j + 2]}`, `map-slide-${directions[j + 2]}`]

                    animateMapSlot(searchMap, fromClass, toClasses)
                }
                await delay(animTime)
                currentMapSlot++    
            }
        } else if (currentMapSlot > toMapSlot) {
            for (let i = 0; i < mapSlotDifference; i++) {
                removeAnimationClasses()
                animTime = Math.round(1000 / Math.abs(currentMapSlot - toMapSlot))

                for (let j = 1; j >= -3; j--) {
                    const searchMap = allMapSlots[currentMapSlot + j]
                    const fromClass = `map-slide-${directions[directions.length - 3 + j]}`
                    const toClasses = [`from-${directions[directions.length - 3 + j]}-to-${directions[directions.length - 2 + j]}`, `map-slide-${directions[directions.length - 2 + j]}`]

                    animateMapSlot(searchMap, fromClass, toClasses)
                }

                await delay(animTime)
                currentMapSlot--
            }
        }

        await delay(250)
        updateStats = true
    }

    if (updateStats) {
        updateStats = false
        starRatingNumberEl.innerText = data.beatmap.stats.stars.total.toFixed(2)
        circleSizeNumberEl.innerText = data.beatmap.stats.cs.converted.toFixed(1)
        approachRateNumberEl.innerText = data.beatmap.stats.ar.converted.toFixed(1)
        overallDifficultyNumberEl.innerText = data.beatmap.stats.od.converted.toFixed(1)
        bpmNumberEl.innerText = data.beatmap.stats.bpm.common

        let currentLen = Math.round((data.beatmap.time.lastObject - data.beatmap.time.firstObject) / 1000)

        // Find map
        const findMap = allBeatmaps.find(beatmap => beatmap.songName === data.beatmap.title && beatmap.difficultyName === data.beatmap.version)
        if (findMap && findMap.modId.includes("DT")) {
            currentLen = Math.round(currentLen / 3 * 2)
        }

        const secondsCounter = currentLen % 60
        lengthnumberEl.innerText = `${Math.floor(currentLen / 60)}:${(secondsCounter < 10) ? '0': ''}${secondsCounter}`
    }

    const fullStrains = data.performance.graph.series[0].data.map((num, index) => num + data.performance.graph.series[1].data[index] + data.performance.graph.series[2].data[index] + data.performance.graph.series[3].data[index]);
    if (tempStrains != JSON.stringify(fullStrains) && window.strainGraph) {
        tempStrains = JSON.stringify(fullStrains)
        if (fullStrains) {
            let temp_strains = smooth(fullStrains, 5)
			let new_strains = []
			for (let i = 0; i < 60; i++) {
				new_strains.push(temp_strains[Math.floor(i * (temp_strains.length / 60))])
			}
			new_strains = [0, ...new_strains, 0]

			config.data.datasets[0].data = new_strains
			config.data.labels = new_strains
			config.options.scales.y.max = Math.max(...new_strains)
			configProgress.data.datasets[0].data = new_strains
			configProgress.data.labels = new_strains
			configProgress.options.scales.y.max = Math.max(...new_strains)
			window.strainGraph.update()
			window.strainGraphProgress.update()
        } else {
			config.data.datasets[0].data = []
			config.data.labels = []
			configProgress.data.datasets[0].data = []
			configProgress.data.labels = []
			window.strainGraph.update()
			window.strainGraphProgress.update()
		}
    }

    let now = Date.now()
	if (fullTime !== data.beatmap.time.mp3Length) { fullTime = data.beatmap.time.mp3Length; onepart = 586 / fullTime }
	if (seek !== data.beatmap.time.live && fullTime && now - last_strain_update > 300) {
		last_strain_update = now
		seek = data.beatmap.time.live

		if (data.state.number !== 2) {
			progressChart.style.maskPosition = '-586px 0px'
			progressChart.style.webkitMaskPosition = '-586px 0px'
		}
		else {
			let maskPosition = `${-586 + onepart * seek}px 0px`
			progressChart.style.maskPosition = maskPosition
			progressChart.style.webkitMaskPosition = maskPosition
		}
	}
}

function nowPlayingDetailTextSlide(element) {
    if (element.getBoundingClientRect().width > 527.38) element.classList.add("textSlide")
    else element.classList.remove("textSlide")
}

// Remove All Animation Classes
function removeAnimationClasses() {
    new Promise((resolve) => {
        for (let i = 0; i < allMapSlots.length; i++) {
            for (let j = 0; j < directions.length - 1; j++) {
                allMapSlots[i].classList.remove(`from-${directions[j]}-to-${directions[j + 1]}`)
                allMapSlots[i].classList.remove(`from-${directions[j + 1]}-to-${directions[j]}`)
            }
        }
        resolve(allBeatmaps)
    })
}

// Configs are for strain graphs
let config = {
	type: 'line',
	data: {
		labels: [],
		datasets: [{
			borderColor: 'rgba(245, 245, 245, 0)',
			backgroundColor: 'rgb(41,207,135)',
			data: [],
			fill: true,
			stepped: false,
		}]
	},
	options: {
		tooltips: { enabled: false },
		legend: { display: false, },
		elements: { point: { radius: 0 } },
		responsive: false,
		scales: {
			x: { display: false, },
			y: {
				display: false,
				min: 0,
				max: 100
			}
		},
		animation: { duration: 0 }
	}
}

let configProgress = {
	type: 'line',
	data: {
		labels: [],
		datasets: [{
			borderColor: 'rgba(245, 245, 245, 0)',
			backgroundColor: '#f2a0dd',
			data: [],
			fill: true,
			stepped: false,
		}]
	},
	options: {
		tooltips: { enabled: false },
		legend: { display: false, },
		elements: { point: { radius: 0 } },
		responsive: false,
		scales: {
			x: { display: false, },
			y: {
				display: false,
				min: 0,
				max: 100
			}
		},
		animation: { duration: 0 }
	}
}

// Submit commentators
const commentatorListEl = document.getElementById("commentator-list")
const commentatorTextEl = document.getElementById("commentator-text")
const commentatorNamesTextAreaEl = document.getElementById("commentator-names-textarea")
function submitCommentators() {
    const commentatorList = commentatorNamesTextAreaEl.value.split("\n")
    commentatorListEl.innerHTML = ""
    let counter = 0        
    for (let i = commentatorList.length - 1; i >= 0; i--) {
        if (commentatorList[i].trim() === "") continue
        counter++
        const newCommentator = document.createElement("div")
        newCommentator.classList.add("commentator-name")
        newCommentator.innerText = commentatorList[i].trim().toUpperCase()
        newCommentator.style.bottom = `${(commentatorList.length - 1 - i) * 32 - 8}px`
        commentatorListEl.append(newCommentator)
    }
    if (counter === 0) {
        commentatorTextEl.style.display = "none"
    } else {
        commentatorTextEl.style.display = "block"
        commentatorTextEl.style.bottom = `${(counter - 1) * 32 + 20}px`
    }
}