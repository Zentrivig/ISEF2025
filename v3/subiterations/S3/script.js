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

const XON = "␑" // Uppercase control (ASCII Device Control One (XON)) is set as a constant, because ␑ is difficult to type and not monospaced

const punctuation = [
	".",
	",",
	"-",
	"'",
	"\"",
	"$",
	"(",
	")",
	":",
	"?",
	"/",
	"!",
	"&",
	";",
	"\n",
	" ",
	"␑",
]

function changeSettings() {
	var wordModelGlobal = document.getElementById("wordModel-select").value
	var brackets = document.getElementById("toggle-brackets").checked
}

document.getElementById("og").innerHTML = sampleSentences[Math.floor(Math.random() * sampleSentences.length)]
changeSettings()

console.log(calculateIndexingScheme(15, 3, 2, x16web))

function copyBitArray() {
	navigator.clipboard.writeText()
}

function calculateIndexingScheme(highestIndex, desiredIndexes, indexAssignmentBitLength, dataset) {
	// highestIndex: The amount of bits it would take to represent the whole dataset in order to trim it to a power of 2
	// desiredIndexes: How many index values you want to have available
	// indexAssignmentBitLength: Flat rate of how many bits each word takes up in its index
	// desiredIndexes and indexAssignmentBitLength need to work together (desiredIndexes <= 2^indexAssignmentBitLength)
	/*
	dataset is an object in the form of:
	{
		words: [],
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
	console.log(indexingScheme)

	// Simulate whole dataset to test its theoretical efficiency
	let totalBitsNLC = 0
	let totalBitsASCII = 0
	for (let i = 0; i < dataset.occurrences.length; i++) {
		// Find which index works best for the word
		let smallestIndexAssignment
		for (let j = 0; j < indexingScheme.length; j++) {
			if (i < Math.pow(2, indexingScheme[j])) {
				smallestIndexAssignment = indexingScheme[j]
				break
			}
		}

		// Index assignment + content bits, all times the amount it occurs in the corpus the data comes from
		totalBitsNLC += (smallestIndexAssignment + indexAssignmentBitLength) * dataset.occurrences[i]
		totalBitsASCII += dataset.lexemes[i].length * 8 * dataset.occurrences[i] // ASCII is just 8 bits per character
	}
	let simulatedRatio = totalBitsASCII / totalBitsNLC
	console.log(totalBitsASCII)
	console.log(totalBitsNLC)
	console.log(simulatedRatio)
	return {
		...dataset,
		totalBitsASCII: totalBitsASCII,
		totalBitsNLC: totalBitsNLC,
		simulatedRatio: simulatedRatio
	}
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