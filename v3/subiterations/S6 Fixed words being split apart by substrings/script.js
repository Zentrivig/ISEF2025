// Letters sorted by frequency from https://en.wikipedia.org/wiki/Letter_frequency
const specialIDs = [
	"e",
	"t",
	"a",
	"o",
	"n",
	"r",
	"i",
	"s",
	"h",
	"d",
	"l",
	"f",
	"c",
	"m",
	"u",
	"g",
	"y",
	"p",
	"w",
	"b",
	"v",
	"k",
	"j",
	"x",
	"z",
	"q",
	"0",
	"1",
	"2",
	"3",
	"4",
	"5",
	// ---^--- Encodable in 5 bits
	"6",
	"7",
	"8",
	"9",
	"�",
]
let formattedArray = []

const XON = "␑" // Uppercase control (ASCII Device Control One (XON)) is set as a constant, because ␑ is difficult to type and not monospaced

function changeSettings() {
	var wordModelGlobal = document.getElementById("wordModel-select").value
	var brackets = document.getElementById("toggle-brackets").checked
}

document.getElementById("og").value = "it was regeneration on another level"//sampleSentences[Math.floor(Math.random() * sampleSentences.length)].toLowerCase()
changeSettings()
encodeInput()

function encodeInput() {
	formattedArray = []
	encode(document.getElementById("og").value)
	document.getElementById("outin").innerHTML = formattedArray.join("")
}

function htmlColor(string, colorString) {
	// Color string is an HTML valid color
	return `<span style="color: ${colorString};">${string}</span>`
}

function encode(inputString) {
	let optimizedArray = optimizeArray(splitIntoArray(inputString))
	for (let i = 0; i < optimizedArray.length; i++) {
		if (optimizedArray[i] == " ") {
			formattedArray.push(htmlColor(`[${optimizedArray[i]}]`, "#ffd700"))
		} else {
			formattedArray.push(htmlColor(`(${optimizedArray[i]})`, "rgb(0, 255, 0)"))
		}
	}

}

function splitFirstInstance(string, stringCondition) {
	return [
		string.substring(0, string.indexOf(stringCondition)),
		string.substring(string.indexOf(stringCondition) + stringCondition.length),
	]
}

function splitIntoArray(input) {
	// Splits the string into lexemes by going through the highest ratio words first
	// View page xx in v3 Write-Up for more information

	function u(unencoded) {
		return [unencoded, "unencoded"]
	}
	function e(encoded) {
		return [encoded, "encoded"]
	}

	let inputArray = []

	if (input.includes("\\")) {
		// Keep words specified in the optimization part continuous
		console.log(input)
		let k = 0
		for (let i = 0; i < input.length; i++) {
			if (input[i] == "\\") {
				let j = i + 1
				while (input[j] != "\\" && j < input.length) {
					j++
				}
				inputArray.push(
					u(input.substring(k, i)),
					e(input.substring(i + 1, j)),
				)
				i = k = j+1

			}
		}
		inputArray.push(u(input.substring(k)))
	} else {
		inputArray = [u(input)]
	}

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
			outputArray.push(inputArray[i][0])
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
				console.log(wordArray.join(" "))
				wordArray = wordArray.join(" ").replaceAll(eval(`/([^\\\\]||$)(${testedWord})([^\\\\]||^)/g`), "$1\\$2\\$3").split(" ")
			}
		} else {
			console.log(`Error word: (${testedWord})`)

		}
	}


	return splitIntoArray(wordArray.join(" "))

}

function simulateLexeme(dataset) {
	// Takes dataset followed by lexeme(s) to simulate
	let bitsNLC = 0
	let bitsASCII = 0
	// Find which index works best for the word
	for (let i = 1; i < arguments.length; i++) {
		let lexeme = arguments[i]
		let smallestIndexAssignment
		for (let j = 0; j < dataset.indexingScheme.length; j++) {
			if (dataset.lexemes.indexOf(lexeme) < Math.pow(2, dataset.indexingScheme[j])) {
				if (!dataset.lexemes.includes(lexeme)) {
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
	navigator.clipboard.writeText(JSON.stringify(datasetConfig(15, 7, 3, x16webRaw)))
	alert("Copied to clipboard")
}

function copyOther() {
	navigator.clipboard.writeText(datasetConfig(15, 7, 3, x16webRaw).ratios.join("\n"))
	alert("Copied to clipboard")
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
	if (!(desiredIndexes <= Math.pow(2, indexAssignmentBitLength))) {
		console.error(`desiredIndexes and indexAssignmentBitLength need to work together (desiredIndexes <= 2^indexAssignmentBitLength)\nCurrently: (${desiredIndexes} <= ${Math.pow(2, indexAssignmentBitLength)}) --> False`)
		return
	}

	let totalOccurrences = 0
	let percentOfLanguage = []
	let percentOfWhole = []

	// Trim the dataset to align with highestIndex
	dataset.occurrences = dataset.occurrences.slice(0, Math.pow(2, highestIndex))
	dataset.lexemes = dataset.lexemes.slice(0, Math.pow(2, highestIndex))

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
	indexingScheme.push(highestIndex)

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
		indexAssignmentBitLength: indexAssignmentBitLength
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

	for (let i = 0; i < input.length; i++) {
		const charCode = input.charCodeAt(i);
		let binaryValue = "";

		for (let j = 7; j >= 0; j--) {
			binaryValue += (charCode >> j) & 1;
		}

		binaryResult += binaryValue;
	}

	return binaryResult.trim();
}