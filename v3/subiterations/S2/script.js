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

let wordModelGlobal
let words
let brackets



document.getElementById("og").innerHTML = sampleSentences[Math.floor(Math.random()*sampleSentences.length)]
changeSettings()

let totalOccurrences = 0
let percentOfLanguage = []
let percentOfWhole = []

let desiredIndexes = 3
let highestIndex = 15

// Trim the dataset to align with highestIndex
x16webOccurrences = x16webOccurrences.slice(0, Math.pow(2, highestIndex))
x16webWords = x16webWords.slice(0, Math.pow(2, highestIndex))

// Create a percent of whole array which shows how much of the dataset can be represented in the above lexemes
for(let i = 0; i < x16webWords.length; i++) {
	totalOccurrences += x16webOccurrences[i]
}
for(let i = 0; i < x16webWords.length; i++) {
	percentOfLanguage.push(x16webOccurrences[i]/totalOccurrences)
}
for(let i = 0; i < x16webWords.length; i++) {
	let sum = 0
	for(let j = 0; j <= i; j++) {
		sum += percentOfLanguage[j]
	}
	percentOfWhole.push(sum)
}

// Create an indexing scheme using desiredIndexes and percentOfWhole
let indexingScheme = []
let numerator = 1
for(let i = 0; i < percentOfWhole.length; i++) {
	if (percentOfWhole[i] >= numerator/desiredIndexes) {
		indexingScheme.push(Math.round(Math.log2(i)))
		numerator++
	}
}
indexingScheme.push(highestIndex)
console.log(indexingScheme)





function copyBitArray() {
	navigator.clipboard.writeText(percentOfWhole.join("\n"))
}

function changeSettings() {
	wordModelGlobal = document.getElementById("wordModel-select").value
	words = eval(wordModelGlobal)
	brackets = document.getElementById("toggle-brackets").checked

	refresh()
}

function refresh() {

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