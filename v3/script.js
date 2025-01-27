/*
Author:	Brian Heers
ISEF 2025 v3 script.js
*/

let formattedArray = []

const XON = "␑" // Space override (ASCII Device Control One (XON)) is set as a constant, because ␑ is difficult to type and not monospaced
const DC2 = "␒" // No space override (ASCII Device Control One (XON)) is set as a constant, because ␑ is difficult to type and not monospaced
const SUB = "�" // Unknown substitute character to substitute any unencodable lexemes (not monospaced so it's a constant)

let liveEncode
let wordModelGlobal
let brackets
let forceDetailed
let encoded

let errorWords = []
let totalWords = 0

// Generated with errorWord testing, occurrences of 0 were made to 1
let specialIDs = {
	chars: [
		XON,
		DC2,
		"a",
		"n",
		"r",
		"e",
		"s",
		"f",
		"i",
		"o",
		"m",
		"g",
		"t",
		"h",
		"l",
		"c",
		"p",
		"d",
		"y",
		"b",
		"u",
		"w",
		"k",
		"x",
		"z",
		"v",
		"j",
		"q",
		"\n",
		SUB
	],
	occurrences: [
		97699,
		70530,
		43361,
		39655,
		16772,
		13364,
		12751,
		7848,
		7680,
		6956,
		5507,
		5219,
		4597,
		4123,
		3752,
		2888,
		2220,
		1997,
		1857,
		1412,
		1179,
		427,
		288,
		121,
		111,
		74,
		2,
		2,
		1,
		0,
	]
}

// Letters sorted by frequency on https://en.wikipedia.org/wiki/Letter_frequency
let freqLetters = ["e", "t", "a", "o", "n", "r", "i", "s", "h", "d", "l", "f", "c", "m", "u", "g", "y", "p", "w", "b", "v", "k", "j", "x", "z", "q"]

//document.getElementById("og").value = ""

changeSettings()

function newSentence() {
	document.getElementById("og").value = sampleSentences[Math.floor(Math.random() * sampleSentences.length)]//.toLowerCase()
	encodeLive()
}

function changeSettings() {
	//wordModelGlobal = document.getElementById("dataset-select").value
	brackets = document.getElementById("toggle-brackets").checked
	liveEncode = document.getElementById("live-encode").checked
	forceDetailed = document.getElementById("toggle-force-detail").checked
	document.getElementById("dataset-stats").innerHTML = [
		`Lexemes:                     (${web15.indexed.lexemes.slice(0, 8).join("), (")}), ..., (${web15.indexed.lexemes[web15.lexemes.length - 1]})`,
		`Sorted by Ratio:             (${web15.lexemes[0]}), ..., (${web15.lexemes[web15.lexemes.length - 1]})`,
		`Elements:                    ${web15.lexemes.length} (2^${Math.log2(web15.lexemes.length)})`,
		`Total Bits ASCII:            ${web15.totalBitsASCII}`,
		`Simulated Total Bits NLC:    ${web15.totalBitsNLC}`,
		`Simulated Ratio:             ${web15.simulatedRatio}`,
		`Indexing Scheme:             [ ${web15.indexingScheme.join(", ")} ]`,
		`Index Assignment Bit Length: ${web15.indexAssignmentBitLength}`,
	].join("\n")
	encodeLive()
}

function decode(encoded, dataset) {
	//Seperate index assignments until the sum of their indexes and the index is the length of encoded
	let indexArray = []
	let i = 0
	let j = dataset.indexAssignmentBitLength
	while (sum(...indexArray, i) < encoded.length) {
		indexArray.push(dataset.indexingScheme[bin2dec(encoded.substring(i, j))])
		i += dataset.indexAssignmentBitLength
		j += dataset.indexAssignmentBitLength
	}

	// Get lexemes
	let lexemeArray = []
	j = i
	for (let k = 0; k < indexArray.length; k++) {
		j += indexArray[k]
		lexemeArray.push(web15.indexed.lexemes[(bin2dec(encoded.substring(i, j)))])
		i += indexArray[k]
	}

	// Spacing
	let output = ""
	for (let i = 0; i < lexemeArray.length; i++) {
		const pre = lexemeArray[i - 1] // Previous
		const cur = lexemeArray[i] // Current
		const nex = lexemeArray[i + 1] // Next
		function ns(lex) { return dataset.spaceDefaults.noSpaces.includes(lex) } // No space
		function rs(lex) { return dataset.spaceDefaults.rightSpace.includes(lex) } // Right space
		function ls(lex) { return dataset.spaceDefaults.leftSpace.includes(lex) } // Left space

		if (ns(cur) || rs(cur)) {
			output += cur
		} else if (ns(pre)) {
			output.slice(0, -1)
			output += cur
		} else if (!ls(pre)) {
			output += " " + cur
		} else {
			output += cur
		}
	}


	return output.trim().replaceAll(XON, " ").replaceAll(DC2, "")
}

function sum() {
	let sum = 0
	for (let i = 0; i < arguments.length; i++) {
		sum += arguments[i]
	}
	return sum
}

function encodeLive() {
	if (liveEncode) {
		encodeInput()
	}
}

function encodeInput() {
	console.clear()
	formattedArray = []
	encoded = encode(document.getElementById("og").value)
	ascii = ascii2bin(document.getElementById("og").value)
	document.getElementById("outin").innerHTML = formattedArray.join("").trim()
	if (brackets) {
		document.getElementById("bitarray").innerHTML = encoded.bracketed
		document.getElementById("ascii").innerHTML = ascii.spaced
	} else {
		document.getElementById("bitarray").innerHTML = encoded.default
		document.getElementById("ascii").innerHTML = ascii.default
	}
	document.getElementById("stats").innerHTML = [
		`NLC Bits:   ${encoded.default.length}`,
		`ASCII Bits: ${ascii.default.length} (${ascii.default.length / 8} * 8)`,
		`Ratio:      ${ascii.default.length / encoded.default.length} : 1`
	].join("\n")

	document.getElementById("out").innerHTML = decode(encoded.default, web15)

	return {
		input: document.getElementById("og").value,
		bitsNLC: encoded.default.length,
		bitsASCII: ascii.default.length,
		ratio: ascii.default.length / encoded.default.length,
		output: document.getElementById("out").innerHTML
	}
}

function htmlColor(string, colorString) {
	// Color string is an HTML valid color
	return `<span style="color: ${colorString};">${string}</span>`
}
//<span class="tooltip">Hover over me<span class="tooltiptext">Tooltip text</span></span> 

function encode(inputString) {
	let lexemeArray = optimizeArray(splitIntoArray(inputString))
	let idArray = createIdArray(lexemeArray)
	let bitArray = createBitArray(idArray, web15)

	let testArray = [...lexemeArray]
	for (let i = 0; i < testArray.length; i++) {
		if (testArray[i][0] == " ") {
			testArray.splice(i, 1)
		}
	}
	totalWords += testArray.length

	renderColored(lexemeArray)
	// Create tooltips for each lexeme
	if (brackets) {
		let offset = 0
		for (let i = 0; i < formattedArray.length; i++) {
			if (formattedArray[i] == " ") {
				offset++
				continue
			}
			let j = i - offset
			formattedArray[i] = `<span class="tooltip">${formattedArray[i]}<span class="tooltiptext">${[
				`Lexeme:        <b>${lexemeArray[i].replace(XON, "XON (Override: Add Space)").replace(DC2, "DC2 (Override: Remove Space)").replace("\n", "\\n")}</b>`,
				`<i>i</i>:             ${j}`,
				`Length:        ${lexemeArray[i].length}`,
				`Ranking:       ${web15.indexed.lexemes.indexOf(lexemeArray[i])}`,
				`Ratio Ranking: ${web15.lexemes.indexOf(lexemeArray[i])}`,
				`Index:         ${bitArray.indexes[j]} -> ${web15.indexingScheme[bin2dec(bitArray.indexes[j])]}`,
				`ASCII Bits:    ${lexemeArray[i].length * 8}`,
				`NLC Bits:      ${(bitArray.IDs[j] + bitArray.indexes[j]).length} (${bitArray.indexes[j]} + ${bitArray.IDs[j]})`,
				`Ratio:         ${Math.round((lexemeArray[i].length * 8) / (bitArray.IDs[j] + bitArray.indexes[j]).length * 100) / 100}`,
			].join("\n")}</span></span>`
		}
	}

	// ------- Detailed Bracket View ------- //
	let bitArrayBracketed = bitArray
	let header = [
		"             <i>i</i>: ",
		"        Binary: ",
		"       Decimal: ",
		"Index / Lexeme: "
	]
	let formattedBrackets = [...header]//["", "", "", "",]
	if (brackets) { // Format for bracket mode
		for (let i = 0; i < bitArray.indexes.length; i++) {
			let values = [
				i,
				bitArray.indexes[i],
				bin2dec(bitArray.indexes[i]),
				web15.indexingScheme[bin2dec(bitArray.indexes[i])]
			]
			let longestElement = 0
			for (let j = 0; j < values.length; j++) {
				longestElement = longestElement < values[j].length ? values[j].length : longestElement
			}

			for (let j = 0; j < values.length; j++) {
				formattedBrackets[j] += String(values[j]).padEnd(longestElement + 1)
			}
		}
		formattedBrackets[0] += "  "
		formattedBrackets[1] += "- "
		formattedBrackets[2] += "  "
		formattedBrackets[3] += "  "
		for (let i = 0; i < bitArray.IDs.length; i++) {
			let values = [
				i,
				bitArray.IDs[i] + (i < (bitArray.IDs.length - 1) ? " |" : ""),
				bin2dec(bitArray.IDs[i]),
				web15.indexed.lexemes[bin2dec(bitArray.IDs[i])]
			]
			if (bitArray.indexes[i] == "111") {
				values[3] = specialIDs[bin2dec(bitArray.IDs[i])]
			}
			let longestElement = 0
			for (let j = 0; j < values.length; j++) {
				longestElement = longestElement < values[j].length ? values[j].length : longestElement
			}
			for (let j = 0; j < values.length; j++) {
				formattedBrackets[j] += String(values[j]).padEnd(longestElement + 1)
			}
		}
	}
	if (formattedBrackets[0].length > screen.width / 9 && !forceDetailed) {
		formattedBrackets = bitArrayBracketed.indexes.join(" ") + " - " + bitArray.IDs.join(" | ")
	} else {
		formattedBrackets[1] = htmlColor(formattedBrackets[1], "rgb(192, 255, 192)")
		formattedBrackets = formattedBrackets.join("\n")
	}
	// ------- Detailed Bracket View ------- //

	return {
		default: bitArray.indexes.join("") + bitArray.IDs.join(""),
		bracketed: formattedBrackets
	}

}

function renderColored(lexemeArray) {
	for (let i = 0; i < lexemeArray.length; i++) {
		if (lexemeArray[i] == XON || lexemeArray[i] == DC2) {
			//errorWords.push(XON)
			if (brackets) {
				formattedArray.push(htmlColor(`[${lexemeArray[i]}]`, "#ffd700"))
			} else {
				formattedArray.push(htmlColor(`${lexemeArray[i]}`, "#ffd700"))
			}
		} else {
			let pre = lexemeArray[i - 1] // Previous
			let cur = lexemeArray[i] // Current
			let nex = lexemeArray[i + 1] // Next
			function ns(lex) { return web15.spaceDefaults.noSpaces.includes(lex) } // No space
			function rs(lex) { return web15.spaceDefaults.rightSpace.includes(lex) } // Right space
			function ls(lex) { return web15.spaceDefaults.leftSpace.includes(lex) } // Left space
			if (brackets) {
				formattedArray.push(htmlColor(`(${cur.replaceAll("\n", "\\n")})`, "rgb(0, 255, 0)"))
			} else {
				let output = ""
				if (ns(cur) || rs(cur)) {
					output += cur
				} else if (ns(pre)) {
					output.slice(0, -1)
					output += cur
				} else if (i > 0 && !ls(pre)) {
					output += " " + cur
				} else {
					output += cur
				}
				formattedArray.push(htmlColor(`${output.replaceAll("<br>", "\\n")}`, "rgb(0, 255, 0)"))
			}
		}
	}
}

function createBitArray(idArray, dataset) {
	let indexBitArray = []
	let idBitArray = []
	for (let i = 0; i < idArray.ids.length; i++) {
		let indexAssignment
		for (let j = 0; j < dataset.indexingScheme.length; j++) {
			if (dec2bin(idArray.ids[i], 0).length <= dataset.indexingScheme[j]) {
				indexAssignment = dataset.indexingScheme[j]
				break
			}
		}
		let binaryID = dec2bin(idArray.ids[i], indexAssignment)
		indexBitArray.push(dec2bin(dataset.indexingScheme.indexOf(indexAssignment), dataset.indexAssignmentBitLength))
		idBitArray.push(binaryID)
	}
	for (let i = 0; i < idArray.specials.length; i++) {
		indexBitArray[idArray.specials[i]] = "111"
	}

	return {
		IDs: idBitArray,
		indexes: indexBitArray
	}
}

function copyBitArray() {
	navigator.clipboard.writeText(encoded.default)
}

function createIdArray(lexemeArray) {
	let idArray = []
	let id
	let specials = []
	for (let i = 0; i < lexemeArray.length; i++) {
		let dpr = lexemeArray[i - 2] // Double Previous
		let pre = lexemeArray[i - 1] // Previous
		let cur = lexemeArray[i] // Current
		let nex = lexemeArray[i + 1] // Next
		function ns(lex) { return web15.spaceDefaults.noSpaces.includes(lex) } // No space
		function rs(lex) { return web15.spaceDefaults.rightSpace.includes(lex) } // Right space
		function ls(lex) { return web15.spaceDefaults.leftSpace.includes(lex) } // Left space

		if (ns(cur)) {
			if (pre == " " && !ns(dpr)) {
				lexemeArray.splice(i - 1, 0, XON)
				i++
			}
			if (nex == " ") {
				lexemeArray.splice(i + 1, 0, XON)
				i++
			}
		} else if (rs(cur) && nex != " " && i + 1 < lexemeArray.length) {
			lexemeArray.splice(i + 1, 0, DC2)
			i++
		} else if (pre == DC2 && ls(dpr)) {
			lexemeArray.splice(i - 1, 1)
		} else if (cur != " " && nex != " " && i + 1 < lexemeArray.length && ((!rs(nex) && !ns(nex)) || ls(nex))) {
			lexemeArray.splice(i + 1, 0, DC2)
			i++
		} else if (cur == " " && ns(nex)) {
			lexemeArray.splice(i, 1, XON)
		} else if (cur == " " && (rs(nex))) {
			lexemeArray.splice(i, 1, XON)
		}
	}


	while (lexemeArray.includes(" ")) {
		lexemeArray.splice(lexemeArray.indexOf(" "), 1)
	}

	for (let i = 0; i < lexemeArray.length; i++) {
		let id = web15.indexed.lexemes.indexOf(lexemeArray[i])
		if (id == -1) {
			id = web15.indexed.lexemes.indexOf(SUB)
			console.log("Unencodable")
		}
		idArray.push(id)
	}
	return { ids: idArray, specials: specials }
}

function splitFirstInstance(string, stringCondition) {
	return [
		string.substring(0, string.indexOf(stringCondition)),
		string.substring(string.indexOf(stringCondition) + stringCondition.length),
	]
}

function splitFirstInstanceInclusive(string, stringCondition) {
	toReturn = []

	if (string.substring(0, string.indexOf(stringCondition)) != "") toReturn.push(string.substring(0, string.indexOf(stringCondition)))
	toReturn.push(stringCondition)
	if (string.substring(string.indexOf(stringCondition) + stringCondition.length) != "") toReturn.push(string.substring(string.indexOf(stringCondition) + stringCondition.length))

	return toReturn
}

function preSplit(input) {
	function u(unencoded) {
		return [unencoded, "unencoded"]
	}
	function e(encoded) {
		return [encoded, "encoded"]
	}

	function processString(input) {
		const regex = /\\(.*?)\\/g
		let result = []
		let lastIndex = 0

		input.replace(regex, (match, p1, offset) => {
			if (offset > lastIndex) {
				result.push(u(input.slice(lastIndex, offset)))
			}
			result.push(e(p1))
			lastIndex = offset + match.length
		})

		if (lastIndex < input.length) {
			result.push(u(input.slice(lastIndex)))
		}

		return result
	}

	const output = processString(input)
	return output
}

function splitIntoArray(input) {
	function u(unencoded) {
		return [unencoded, "unencoded"]
	}
	function e(encoded) {
		return [encoded, "encoded"]
	}
	let inputArray = []
	if (input.includes("\\")) {
		inputArray.push(...preSplit(input))
	} else {
		inputArray.push(u(input))
	}
	// Splits the string into lexemes by going through the highest ratio words first
	// View page xx in v3 Write-Up for more information


	for (let i = 0; i < web15.ratios.length; i++) {
		for (let j = 0; j < inputArray.length; j++) {
			if (inputArray[j][1] == "unencoded" && inputArray[j][0].includes(web15.lexemes[i])) {
				let splitArray = splitFirstInstance(inputArray[j][0], web15.lexemes[i])
				inputArray.splice(j, 1, u(splitArray[0]), e(web15.lexemes[i]), u(splitArray[1]))
				j = 0
			}
		}
	}

	let outputArray = []
	for (let i = 0; i < inputArray.length; i++) {
		if (inputArray[i][0] != "") {
			if (inputArray[i][1] == "unencoded" && inputArray[i][0] != " ") {
				console.log(inputArray[i][0])
				errorWords.push(inputArray[i][0].trim())
			} else {
				outputArray.push(inputArray[i][0])
			}
		}
	}
	return outputArray
}

function optimizeArray(inputArray) {
	let wordArray = inputArray.join("").split(" ")
	for (let i = 0; i < wordArray.length; i++) {
		let testedWord = wordArray[i]
		if (web15.lexemes.includes(testedWord)) {
			if (simulateLexeme(web15, testedWord).ratio > simulateLexeme(web15, ...splitIntoArray(testedWord)).ratio) {
				//console.log((`/([^\\\\]{1}|^)(${testedWord.replaceAll(/([\^\$\\\.\*\+\?\(\)\[\]\{\}\|\/])/g, "\\$1")})([^\\\\]{1}|$)/g`), " with $1\\$2\\$3")
				//console.log(wordArray)
				// (it.) evaluates to \([^\\]||$)(it.)([^\\]||^)\g and . is a wildcard!
				wordArray = slashMark(testedWord)
				//console.log(slashMark(testedWord))
			}
		} else if (testedWord != "" && !testedWord.includes("\\")) {
			let errorWord = testedWord
			let possibleSplits = []
			console.log(`Optimizing: (${errorWord})`)
			let detailedLog = false
			if (errorWord.length > 16) {
				console.log(`Lexeme is ${errorWord.length} characters long,\nOptimization progress:`)
				detailedLog = true
			}
			let testedSubstring
			for (let j = 0; j < errorWord.length; j++) {
				if(detailedLog) {
					console.log(`${Math.round(100*j/errorWord.length)}% Complete`)
				}
				for (let k = 0; k < errorWord.length; k++) {
					testedSubstring = errorWord.substring(k, errorWord.length - j + k)
					//console.log(splitFirstInstanceInclusive(errorWord, testedSubstring).join(", ").replaceAll("\n", "\\n"))
					//console.log(testedSubstring, simulateLexeme(web15, ...splitFirstInstanceInclusive(errorWord, testedSubstring)), splitFirstInstanceInclusive(errorWord, testedSubstring))
					if (simulateLexeme(web15, ...splitFirstInstanceInclusive(errorWord, testedSubstring)).ratio >= simulateLexeme(web15, ...splitIntoArray(errorWord)).ratio) {
						possibleSplits.push({ split: splitFirstInstanceInclusive(errorWord, testedSubstring), ratio: simulateLexeme(web15, ...splitFirstInstanceInclusive(errorWord, testedSubstring)).ratio })
					}
				}
			}
			let highestRatio = possibleSplits[0]
			for (let j = 0; j < possibleSplits.length; j++) {
				highestRatio = possibleSplits[j].ratio > highestRatio.ratio ? possibleSplits[j] : highestRatio
			}
			//console.log(highestRatio)
			if (highestRatio != undefined) {
				//wordArray = slashMark(testedSubstring)
				//console.log(highestRatio.split.join(""))
				let toReplace = highestRatio.split.join("")
				let replaceWith = ""
				for (let j = 0; j < highestRatio.split.length; j++) {
					replaceWith += "\\" + highestRatio.split[j] + "\\"
				}
				//console.log(replaceWith)
				wordArray = wordArray.join(" ").replaceAll(toReplace, replaceWith).split(" ")
			}
		}
	}

	return splitIntoArray(wordArray.join(" "))

	function slashMark(testedWord) {
		return wordArray.join(" ").replaceAll(eval(`/([^\\\\]{1}|^)(${testedWord.replaceAll(/([\^\$\\\.\*\+\?\(\)\[\]\{\}\|\/])/g, "\\$1")})([^\\\\]{1}|$)/g`), "$1\\$2\\$3").split(" ")
	}
}

function simulateLexeme(dataset) {
	// Takes dataset followed by lexeme(s) to simulate
	let bitsNLC = 0
	let bitsASCII = 0
	// Find which index works best for the word
	for (let i = 1; i < arguments.length; i++) {
		let lexeme = arguments[i]
		let smallestIndexAssignment
		for (let j = 0; j < dataset.indexed.indexingScheme.length; j++) {
			if (dataset.indexed.lexemes.indexOf(lexeme) < Math.pow(2, dataset.indexed.indexingScheme[j])) {
				if (!dataset.indexed.lexemes.includes(lexeme)) {
					return NaN
				}
				smallestIndexAssignment = dataset.indexingScheme[j]
				break
			}
		}
		bitsNLC += smallestIndexAssignment + dataset.indexAssignmentBitLength
		bitsASCII += lexeme.length * 8
	}
	return {
		bitsNLC: bitsNLC,
		bitsASCII: bitsASCII,
		ratio: bitsASCII / bitsNLC
	}
}

function preconfigCopy() {
	navigator.clipboard.writeText("let web15 = " + JSON.stringify(datasetConfig(15, 7, 3, x16webRaw)))
}

function copyOther() {
	navigator.clipboard.writeText(datasetConfig(15, 7, 3, x16webRaw).ratios.join("\n"))
}

function analyseIndexingSchemes() {
	let test = ""
	let testingHighestIndex = 15
	let testingDesiredIndexes = 3
	let testingIndexAssignmentBitLength = 1

	for (let k = 15; k > 0; k--) {
		for (let j = 1; j <= 3; j++) {
			for (let i = 0; i < 2; i++) {
				let processedDataset = datasetConfig(k, Math.pow(2, j) - i, j, x16webRaw)

				test += `${k}\t${Math.pow(2, j) - i}\t${j}\t${processedDataset.totalBitsASCII}\t${processedDataset.totalBitsNLC}\t${processedDataset.simulatedRatio}\t${processedDataset.indexingScheme}\n`
			}
		}
	}

	navigator.clipboard.writeText(test)
	alert("Copied to clipboard")
}

function datasetConfig(highestIndex, desiredIndexes, indexAssignmentBitLength, dataset) {
	// highestIndex: The amount of bits it would take to represent the whole dataset in order to trim it to a power of 2
	// desiredIndexes: How many index values you want to have available
	// indexAssignmentBitLength: Flat rate of how many bits each word takes up in its index
	// desiredIndexes and indexAssignmentBitLength need to work together (desiredIndexes <= 2^indexAssignmentBitLength)
	/*
	dataset is an object in the form of:
	{
		lexemes: [],
		occurrences: []
	}
	*/

	let spaceDefaults = {
		noSpaces: [
			"'",
			"-",
			"\"",
			"\n",
			"n",
			"r",
			"e",
			"f",
			"i",
			"o",
			"m",
			"g",
			"t",
			"h",
			"l",
			"c",
			"p",
			"d",
			"y",
			"b",
			"u",
			"w",
			"k",
			"x",
			"z",
			"v",
			"j",
			"q",
			XON,
			DC2,
		],
		rightSpace: [
			".",
			",",
			":",
			";",
			"!",
			")",
			"%",
			"”",
			"’",
			"s",
			"?"
		],
		leftSpace: [
			"“",
			"‘",
			"(",
			"$",
			"£",
			"€",
			"A",
			"B",
			"C",
			"D",
			"E",
			"F",
			"G",
			"H",
			"I",
			"J",
			"K",
			"L",
			"M",
			"N",
			"O",
			"P",
			"Q",
			"R",
			"S",
			"T",
			"U",
			"V",
			"W",
			"X",
			"Y",
			"Z",
		]
	}

	if (!(desiredIndexes <= Math.pow(2, indexAssignmentBitLength))) {
		console.error(`desiredIndexes and indexAssignmentBitLength need to work together (desiredIndexes <= 2^indexAssignmentBitLength)\nCurrently: (${desiredIndexes} <= ${Math.pow(2, indexAssignmentBitLength)}) --> False`)
		return
	}

	let totalOccurrences = 0
	let percentOfLanguage = []
	let percentOfWhole = []

	//Remove single letter lexemes
	for (let i = 0; i < dataset.lexemes.length; i++) {
		if (freqLetters.includes(dataset.lexemes[i])) {
			dataset.lexemes.splice(i, 1)
			dataset.occurrences.splice(i, 1)
		}
	}

	// Trim the dataset to align with highestIndex
	dataset.occurrences = dataset.occurrences.slice(0, Math.pow(2, highestIndex))
	dataset.lexemes = dataset.lexemes.slice(0, Math.pow(2, highestIndex))

	// Insert specialIDs
	dataset.lexemes.splice(-specialIDs.chars.length, specialIDs.chars.length, ...specialIDs.chars)
	dataset.occurrences.splice(-specialIDs.occurrences.length, specialIDs.occurrences.length, ...specialIDs.occurrences)
	console.log(dataset.lexemes)

	// Sort the dataset based on the occurrence column
	let combined0 = dataset.lexemes.map((lexeme, index) => ({
		lexeme,
		occurrence: dataset.occurrences[index]
	}));

	combined0.sort((a, b) => b.occurrence - a.occurrence);

	dataset.lexemes = combined0.map(item => item.lexeme);
	dataset.occurrences = combined0.map(item => item.occurrence);

	// Create a percentOfWhole array which shows how much of the dataset can be represented in the above lexemes
	for (let i = 0; i < dataset.lexemes.length; i++) {
		totalOccurrences += dataset.occurrences[i]
	}
	for (let i = 0; i < dataset.lexemes.length; i++) {
		percentOfLanguage.push(dataset.occurrences[i] / totalOccurrences)
	}
	for (let i = 0; i < dataset.lexemes.length; i++) {
		let sum = 0
		for (let j = 0; j <= i; j++) {
			sum += percentOfLanguage[j]
		}
		percentOfWhole.push(sum)
	}

	// Create an indexing scheme using desiredIndexes and percentOfWhole
	let indexingScheme = []
	let numerator = 1
	for (let i = 0; i < percentOfWhole.length; i++) {
		if (percentOfWhole[i] >= numerator / desiredIndexes) {
			indexingScheme.push(Math.round(Math.log2(i)))
			numerator++
		}
	}
	indexingScheme.push("DIF")

	// Simulate whole dataset to test its theoretical efficiency and calculate a ratio for each lexeme
	let totalBitsNLC = 0
	let totalBitsASCII = 0
	let wordRatios = []
	for (let i = 0; i < dataset.occurrences.length; i++) {
		// Find which index works best for the word
		let smallestIndexAssignment
		for (let j = 0; j < indexingScheme.length; j++) {
			if (i < Math.pow(2, indexingScheme[j])) {
				smallestIndexAssignment = indexingScheme[j]
				break
			}
		}

		let bitsNLC = (smallestIndexAssignment + indexAssignmentBitLength) * dataset.occurrences[i] // Index assignment + content bits, all times the amount it occurs in the corpus the data comes from
		let bitsASCII = dataset.lexemes[i].length * 8 * dataset.occurrences[i] // ASCII is just 8 bits per character

		wordRatios.push(bitsASCII / bitsNLC)
		totalBitsNLC += bitsNLC
		totalBitsASCII += bitsASCII
	}
	let simulatedRatio = totalBitsASCII / totalBitsNLC
	dataset = {
		...dataset,
		ratios: wordRatios
	}

	let resultsIndexed = {
		...dataset,
		totalBitsASCII: totalBitsASCII,
		totalBitsNLC: totalBitsNLC,
		simulatedRatio: simulatedRatio,
		indexingScheme: indexingScheme,
		indexAssignmentBitLength: indexAssignmentBitLength,
	}

	// Sort the dataset based on the ratio column

	let combined = dataset.lexemes.map((lexeme, index) => ({
		lexeme,
		occurrence: dataset.occurrences[index],
		ratio: wordRatios[index]
	}));

	combined.sort((a, b) => b.ratio - a.ratio);

	dataset.lexemes = combined.map(item => item.lexeme);
	dataset.occurrences = combined.map(item => item.occurrence);
	dataset.ratios = combined.map(item => item.ratio);

	let results = {
		...dataset,
		totalBitsASCII: totalBitsASCII,
		totalBitsNLC: totalBitsNLC,
		simulatedRatio: simulatedRatio,
		indexingScheme: indexingScheme,
		indexAssignmentBitLength: indexAssignmentBitLength,
		indexed: resultsIndexed,
		spaceDefaults: spaceDefaults
	}

	// Return the results
	console.log("Dataset configured")
	console.log(results)
	return results
}

function dec2bin(dec, length) {
	// returns binary of decimal. dec is decimal input. length determines necessary leading zeroes 
	// ex. dec2bin(19, 8) => 00010011 dec2bin(19,0) => 10011
	let bin = ""
	while (true) {
		bin = dec % 2 + bin
		dec = Math.floor(dec / 2)
		if (dec == 0) break
	}
	let binlen = bin.length
	for (let i = 0; i < length - binlen; i++) {
		bin = 0 + bin
	}
	return (bin)
}

function bin2dec(bin) {
	let binaryArray = bin.split("")
	let dec = 0
	for (let i = 0; i < binaryArray.length; i++) {
		dec += Math.pow(2, i) * binaryArray[binaryArray.length - i - 1]
	}
	return (dec)
}


function ascii2bin(input) {
	// Credit: https://www.geeksforgeeks.org/javascript-program-to-convert-a-string-to-binary/
	let binaryResult = "";
	let binaryResultSpaced = "";

	for (let i = 0; i < input.length; i++) {
		const charCode = input.charCodeAt(i);
		let binaryValue = "";

		for (let j = 7; j >= 0; j--) {
			binaryValue += (charCode >> j) & 1;
		}

		binaryResultSpaced += binaryValue + " ";
		binaryResult += binaryValue;
	}

	return { default: binaryResult.trim(), spaced: binaryResultSpaced.trim() };
}

function copyErrorWords() {
	testing = false
	console.log(errorWords)
	let letterFreq = [...freqLetters, XON, SUB]
	for (let i = 0; i < letterFreq.length; i++) {
		let letter = letterFreq[i]
		letterFreq[i] = [letter, errorWords.filter(x => x == letter).length]
	}
	let toCopy = totalWords + "\n"
	for (let i = 0; i < letterFreq.length; i++) {
		toCopy += letterFreq[i].join("\t") + "\n"
	}
	navigator.clipboard.writeText(toCopy)
}

// Data Analysis
let testing = false
function commenceTesting() {
	testing = true
}

let testResults = []

console.log(encodeInput())
function draw() {
	if (testing) {
		document.getElementById("og").value = sampleSentences[Math.floor(Math.random() * sampleSentences.length)]//.toLowerCase()
		testResults.push(encodeInput())
		document.getElementById("test-stats").innerHTML = [
			`<tr><td>Sentences:</td><td>${testResults.length}</td></tr>`,
		].join("\n")
	}
}

function copyResults() {
	testing = false
	let toCopy = ""
	for (let i = 0; i < testResults.length; i++) {
		let x = testResults[i]
		toCopy += x.input + "\t" + x.bitsNLC + "\t" + x.bitsASCII + "\t" + x.ratio + "\n"
	}
	navigator.clipboard.writeText(toCopy)
}

/*
	return {
		input: document.getElementById("og").value,
		bitsNLC: encoded.default.length,
		bitsASCII: ascii.default.length,
		ratio: ascii.default.length / encoded.default.length
	}
*/