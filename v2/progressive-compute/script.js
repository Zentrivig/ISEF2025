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
let formattedarray = []
let formattedBitArray = []

const maxRatio = 16 // Calculated manually (dependent on dataset)
const blueThreshold = 2 // Aesthetics

let brackets = true


let words = []

let wordModelGlobal = ""

let step = -2

let wordModel
let og
let idArray
let bitArray
let simplicity
let punctuationOrder
let raw
let rawArray
let sp
let i
let punct

let speed = 20

let asciiOut

function setup() {
	changeWordModel()
	toggleBrackets()
}

function changeWordModel() {
	wordModelGlobal = document.getElementById("wordModel-select").value
	words = eval(wordModelGlobal)
}

function toggleBrackets() {
	brackets = document.getElementById("toggle-brackets").checked
}

function copyBitArray() {
	if (brackets) navigator.clipboard.writeText(formattedBitArray.join(""));
	if (!brackets) navigator.clipboard.writeText(encoded);
}

function startCompute() {
	step = 0
	asciiOut = ascii2bin(document.getElementById("og").value)
}

function draw() {
	for(let i = 0; i < speed; i++) refresh()
}

function copyWords() {
	let wordRatios = []
	for (let i = 0; i < 10; i++) {
		wordRatios.push([words[i], words[i].length * 2, Math.ceil(dec2bin(i + punctuation.length + specialIDs.length, 0).length / 4)].join("\t"))
	}
	navigator.clipboard.writeText(wordRatios.join("\n"));
}

let i0 = 0
let i1 = 0
let i2 = 0
let i3 = 0

function refresh() {
	if (step == 0) {
		wordModel = wordModelGlobal
		idArray = []
		formattedarray = []
		formattedBitArray = []
		bitArray = []

		simplicity = false
		punctuationOrder = 0

		og = document.getElementById("og").value

		// Convert og to rawArray (seperate by space and punctuation)
		raw = og.toLowerCase();
		rawArray = []
		sp = 0
		i = 0
		punct = ""

		step++
	}

	if (step == 1) {
		if (i0 < raw.length) {
			while (!punctuation.includes(raw.charAt(i0))) { // Increase i until a punctuation is reached
				i0++
				if (i0 >= raw.length) break // Protects against freezing
			}
			punct = raw.charAt(i0)
			if (punct == " ") {
				if (punctuation.includes(raw.charAt(i0 + 1))) {
					rawArray.push(raw.substring(sp, i0), " ") // Spaces are not ignored if a punctuation is after the space (He said, "Hello World.")
				} else {
					rawArray.push(raw.substring(sp, i0)) // Spaces are ignored
				}
			} else {
				rawArray.push(raw.substring(sp, i0), punct) // Punctuation with no preceding spaces are added
			}
			i0++
			while (punctuation.includes(raw.charAt(i0))) { // Accounts for all punctuation after 1st punctuation
				punct = raw.charAt(i0)
				rawArray.push(punct)
				i0++
			}
			sp = i0
		} else step++
	}

	if (step == 2) {
		// Assign identifiers
		if (i1 < rawArray.length) {
			if (punctuation.includes(rawArray[i1])) {
				// Check punctuation
				idArray.push(punctuation.indexOf(rawArray[i1]))
				if (brackets) formattedarray.push(`<span style="color: #ffd700;">[${rawArray[i1].replace("\n", "<br>")}]</span>`)
				if (!brackets) formattedarray.push(`<span style="color: #ffd700;">${rawArray[i1].replace("\n", "<br>")}</span>`)
			} else if (words.includes(rawArray[i1])) {
				// Check words
				idArray.push(words.indexOf(rawArray[i1]) + punctuation.length + specialIDs.length)

				if (brackets) formattedarray.push(`<span style="color: rgb(0,255,0);">(${rawArray[i1]})</span>${!(punctuation.includes(rawArray[i1 + 1])) && rawArray[i1 + 1] != "" ? " " : ""}`) // Adds text to formattedarray, along with whitespace if there is not following puntuation
				if (!brackets) formattedarray.push(`<span style="color: rgb(0,255,0);">${rawArray[i1]}</span>${!(punctuation.includes(rawArray[i1 + 1])) && rawArray[i1 + 1] != "" ? " " : ""}`)
				
			} else if (rawArray[i1] != "") {
				// Create words from letters, numbers, and unknown character
				for (let j = 0; j < rawArray[i1].length; j++) {
					idArray.push(specialIDs.indexOf(rawArray[i1][j]) + punctuation.length)
					if (!specialIDs.includes(rawArray[i1][j])) idArray.push(specialIDs.indexOf("�") + punctuation.length)
				}
				if (brackets) formattedarray.push(`<span style="color: rgb(255, 0, 0);">{${rawArray[i1]}}</span>`)
				if (!brackets) formattedarray.push(`<span style="color: rgb(255, 0, 0);">${rawArray[i1]}</span>`)
				if (!punctuation.includes(rawArray[i1 + 1])) {
					idArray.push(punctuation.indexOf(" "))
					formattedarray.push(" ")
				}
			}
			i1++
		} else step++
	}

	if (step == 3) {
		// Create binary datastream

		// Control
		//bitArray.push(
		//	simplicity ? 1 : 0,
		//	wordModel == "web333k" ? 0 : 1,
		//	punctuationOrder
		//)
		if (brackets) formattedBitArray.push(simplicity ? 1 : 0, wordModel == "web333k" ? 0 : 1, punctuationOrder, " - ")
		step++
	}

	if (step == 4) {
		// Indexes
		if (i2 < idArray.length) {
			bitArray.push(dec2bin(Math.ceil(dec2bin(idArray[i2], 0).length / 4), 3))
			if (brackets) formattedBitArray.push(dec2bin(Math.ceil(dec2bin(idArray[i2], 0).length / 4), 3), " ")
			i2++
		} else step++
	}

	if (step == 5) {
		bitArray.push("000")
		if (brackets) formattedBitArray.push("(000) - ")
		step++
	}

	if (step == 6) {
		if (i3 < idArray.length) {
			/*
			dec2bin(310,0) =>
			"100110110" length = 9 (lead to the nearest 4-bit boundary: should be 12)
			4*floor(x/4+1)
			9 => 12
			dec2bin(310,12) => "000100110110" length = 9
			*/
			bitArray.push(dec2bin(idArray[i3], 4 * Math.ceil(dec2bin(idArray[i3], 0).length / 4)))
			if (brackets) {
				for (let j = 0; j < bitArray[bitArray.length - 1].length / 4; j++) {
					formattedBitArray.push(bitArray[bitArray.length - 1].substring(j * 4, j * 4 + 4), " ")
				}
				if (i3 + 1 < idArray.length) formattedBitArray.push(" | ")
			}
			i3++
		} else step++

		
	}

	if (step == 7) {
		//decode()
		step = -1
	}
	
	if (step != -2) {
		encoded = bitArray.join("")
		if (brackets) document.getElementById("bitarray").innerHTML = formattedBitArray.join("")
		if (!brackets) document.getElementById("bitarray").innerHTML = encoded
		document.getElementById("outin").innerHTML = formattedarray.join("")
		document.getElementById("out").innerHTML = decoded.join("")
		document.getElementById("ascii").innerHTML = asciiOut

		document.getElementById("stats").innerHTML =
			"<br>NLC Size - " + encoded.length +
			"<br>ASCII Size - " + asciiOut.length +
			"<br>Ratio - " + asciiOut.length / encoded.length + " : 1"
		if (step == -1) step = -2
	}
}

function decode() {
	let indexArray = []
	let idArray = []
	let idLookup = [...punctuation, ...specialIDs, ...words]
	decoded = []

	// Control
	let simplicity = encoded[0] == 0 ? false : true
	if (!simplicity) {
		let wordModel = encoded[1] == 0 ? "web333k" : "wikipedia1k"
		let punctuationOrder = encoded[2]
	}

	// Indexes
	for (let i = 0; true; i++) {
		if (encoded.substring(3 * i, 3 * i + 3) == "000") break
		indexArray.push(bin2dec(encoded.substring(3 * i, 3 * i + 3)))
	}

	// IDs
	let j = indexArray.length * 3 + 3
	for (let i = 0; i < indexArray.length; i++) {
		idArray.push(bin2dec(encoded.substring(j, j + 4 * indexArray[i])))
		j = j + 4 * indexArray[i]
	}

	// Convert IDs to content
	for (let i = 0; i < idArray.length; i++) {
		decoded.push(idLookup[idArray[i]].replace("\n", "<br>"))

		// If word followed by word, place space
		if (words.includes(idLookup[idArray[i]]) && (words.includes(idLookup[idArray[i + 1]]) || specialIDs.includes(idLookup[idArray[i + 1]]))) decoded.push(" ")
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
	let binarray = bin.split("")
	let dec = 0
	for (let i = 0; i < binarray.length; i++) {
		dec += Math.pow(2, i) * binarray[binarray.length - i - 1]
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
