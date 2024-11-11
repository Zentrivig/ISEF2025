// Letters sorted by frequency on https://en.wikipedia.org/wiki/Letter_frequency
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
	"6",
	"7",
	"8",
	"9",
	"�",
]
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
]
let encoded = ""
let decoded = []

let words = []

let wordModelGlobal = ""

function setup() {
	changeWordModel()
	refresh()
}

function changeWordModel() {
	wordModelGlobal = document.getElementById("wordModel-select").value
	words = eval(wordModelGlobal)
	refresh()
}

function refresh() {
	let encoded = document.getElementById("og").value
	let indexArray = []
	let idArray = []
	let idLookup = [...punctuation,...specialIDs,...words]
	decoded = []
	console.log(encoded)
	
	// Control
	let simplicity = encoded[0] == 0 ? false : true
	if (!simplicity) {
		let wordModel = encoded[1] == 0 ? "web333k" : "wikipedia1k"
		let punctuationOrder = encoded[2]
	}
	
	// Indexes
	
	for (let i = 0; true; i++) {
		if (encoded.substring(3 * i + 3, 3 * i + 6) == "000") break
		indexArray.push(bin2dec(encoded.substring(3 * i + 3, 3 * i + 6)))
	}

	// IDs
	let j = indexArray.length * 3 + 3
	for (let i = 0; i < indexArray.length; i++) {
		idArray.push(bin2dec(encoded.substring(j + 3, j + 4 * indexArray[i] + 3)))
		j = j + 4 * indexArray[i]
	}

	// Convert IDs to content
	for (let i = 0; i < idArray.length; i++) {
		
		decoded.push(idLookup[idArray[i]].replace("\n", "<br>"))

		// If word followed by word, place space
		if (words.includes(idLookup[idArray[i]]) && (words.includes(idLookup[idArray[i + 1]]) || specialIDs.includes(idLookup[idArray[i+1]]))) decoded.push(" ")
	}
	document.getElementById("outin").innerHTML = decoded.join("")
}

function bin2dec(bin) {
	let binarray = bin.split("")
	let dec = 0
	for (let i = 0; i < binarray.length; i++) {
		dec += Math.pow(2, i) * binarray[binarray.length - i - 1]
	}
	return (dec)
}