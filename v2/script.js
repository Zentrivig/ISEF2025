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

const maxRatio = 9 // Aesthetics (Calculated manually dependent on dataset)
const blueThreshold = 3 // Aesthetics

let brackets = true

let startTime
let endTime
let timeDelta
/*
let timeTesting = false
let iteration = 0
let timeData = [[0]]
*/

let words = []

let wordModelGlobal = ""

function setup() {
	changeWordModel()
	toggleBrackets()
	refresh()
}

function changeWordModel() {
	wordModelGlobal = document.getElementById("wordModel-select").value
	words = eval(wordModelGlobal)
	refresh()
}

function toggleBrackets() {
	brackets = document.getElementById("toggle-brackets").checked
	refresh()
}

function copyBitArray() {
	if (brackets) navigator.clipboard.writeText(formattedBitArray.join(""));
	if (!brackets) navigator.clipboard.writeText(encoded);
} 

function draw() {
	//startTimeTest()
}

function copyWords() {
	//let wordRatios = []
	//for (let i = 0; i < 10; i++) {
	//	wordRatios.push([words[i], words[i].length * 2, Math.ceil(dec2bin(i + punctuation.length + specialIDs.length, 0).length / 4)].join("\t"))
	//}
	//navigator.clipboard.writeText(wordRatios.join("\n"));

	navigator.clipboard.writeText(timeData.join("\n").replaceAll(",", "\t"));
}



function startTimeTest() {
	timeTesting = true
	console.log(timeData);
	document.getElementById("og").value = news.substring(0,iteration)
	refresh();
	timeData[iteration].push(timeDelta)
	if(timeData[iteration].length == 5) {
		iteration+= 1
		timeData.push([iteration])
	}
}

function refresh() {
	startTime = Date.now()
	reset = false
	let wordModel = wordModelGlobal
	let og = ""
	let idArray = []
	formattedarray = []
	formattedBitArray = []
	let bitArray = []

	let simplicity = false
	let punctuationOrder = 0

	og = document.getElementById("og").value

	// Convert og to rawArray (seperate by space and punctuation)
	let raw = og.toLowerCase();
	let rawArray = []
	let sp = 0
	let i = 0
	let punct = ""
	while (i < raw.length) {
		while (!punctuation.includes(raw.charAt(i))) { // Increase i until a punctuation is reached
			i++
			if (i >= raw.length) break // Protects against freezing
		}
		punct = raw.charAt(i)
		if (punct == " ") {
			if (punctuation.includes(raw.charAt(i + 1))) {
				rawArray.push(raw.substring(sp, i), " ") // Spaces are not ignored if a punctuation is after the space (He said, "Hello World.")
			} else {
				rawArray.push(raw.substring(sp, i)) // Spaces are ignored
			}
		} else {
			rawArray.push(raw.substring(sp, i), punct) // Punctuation with no preceding spaces are added
		}
		i++
		while (punctuation.includes(raw.charAt(i))) { // Accounts for all punctuation after 1st punctuation
			punct = raw.charAt(i)
			rawArray.push(punct)
			i++
		}
		sp = i
	}

	// Assign identifiers
	for (let i = 0; i < rawArray.length; i++) {
		if (punctuation.includes(rawArray[i])) {
			// Check punctuation
			idArray.push(punctuation.indexOf(rawArray[i]))
			if (brackets) formattedarray.push(`<span style="color: #ffd700;">[${rawArray[i].replace("\n", "<br>")}]</span>`)
			if (!brackets) formattedarray.push(`<span style="color: #ffd700;">${rawArray[i].replace("\n", "<br>")}</span>`)
		} else if (words.includes(rawArray[i])) {
			// Check words
			idArray.push(words.indexOf(rawArray[i]) + punctuation.length + specialIDs.length)

			// Format text
			let idNybbleSize = Math.ceil(dec2bin(words.indexOf(rawArray[i].toLowerCase()) + punctuation.length, 0).length / 4)
			let asciiNybbleSize = ascii2bin(rawArray[i]).length / 4
			let x = asciiNybbleSize / idNybbleSize // Ratio
			let t = blueThreshold
			let m = maxRatio
			if (brackets) formattedarray.push(`<span style="color: rgb(${x < t ? 255 - 255 * x / t : 0}, 255, ${x >= t ? 255 * (x - t) / (m - t) : 255 - 255 * x / t});">(${rawArray[i]})</span>${!(punctuation.includes(rawArray[i + 1])) && rawArray[i + 1] != "" ? " " : ""}`) // Adds text to formattedarray, along with whitespace if there is not following puntuation
			if (!brackets) formattedarray.push(`<span style="color: rgb(${x < t ? 255 - 255 * x / t : 0}, 255, ${x >= t ? 255 * (x - t) / (m - t) : 255 - 255 * x / t});">${rawArray[i]}</span>${!(punctuation.includes(rawArray[i + 1])) && rawArray[i + 1] != "" ? " " : ""}`)
			/* Color control for words:
				Channels
					Red
						Linearly decreases from (0,255) to (blueThreshold, 0)
						Remains constant at 0 after blueThreshold
					Green
						Remains constant at 255
					Blue
						Follows red channel until blueThreshold
						Linearly increases from (blueThreshold, 0) to (maxRatio, 255)
				Effect
					Low ratios are whiter, and become greener as the ratio increases until the blueThreshold. After that, they become cyaner until maxRatio, the most efficient word.
			*/
		} else if (rawArray[i] != "") {
			// Create words from letters, numbers, and unknown character
			for (let j = 0; j < rawArray[i].length; j++) {
				idArray.push(specialIDs.indexOf(rawArray[i][j]) + punctuation.length)
				if(!specialIDs.includes(rawArray[i][j])) idArray.push(specialIDs.indexOf("�") + punctuation.length)
			}
			if (brackets) formattedarray.push(`<span style="color: rgb(255, 0, 0);">{${rawArray[i]}}</span>`)
			if (!brackets) formattedarray.push(`<span style="color: rgb(255, 0, 0);">${rawArray[i]}</span>`)
			if (!punctuation.includes(rawArray[i + 1])) {
				idArray.push(punctuation.indexOf(" "))
				formattedarray.push(" ")
			}
		}
	}

	// Create binary datastream

	// Control
	//bitArray.push(
	//	simplicity ? 1 : 0,
	//	wordModel == "web333k" ? 0 : 1,
	//	punctuationOrder
	//)
	//if (brackets) formattedBitArray.push(simplicity ? 1 : 0, wordModel == "web333k" ? 0 : 1, punctuationOrder, " - ")

	// Indexes
	for (let i = 0; i < idArray.length; i++) {
		bitArray.push(dec2bin(Math.ceil(dec2bin(idArray[i], 0).length / 4), 3))
		if (brackets) formattedBitArray.push(dec2bin(Math.ceil(dec2bin(idArray[i], 0).length / 4), 3), " ")
	}

	bitArray.push("000")
	if (brackets) formattedBitArray.push("(000) - ")
	for (let i = 0; i < idArray.length; i++) {
		/*
		dec2bin(310,0) =>
		"100110110" length = 9 (lead to the nearest 4-bit boundary: should be 12)
		4*floor(x/4+1)
		9 => 12
		dec2bin(310,12) => "000100110110" length = 9
		*/
		bitArray.push(dec2bin(idArray[i], 4 * Math.ceil(dec2bin(idArray[i], 0).length / 4)))
		if (brackets) {
			for (let j = 0; j < bitArray[bitArray.length - 1].length / 4; j++) {
				formattedBitArray.push(bitArray[bitArray.length - 1].substring(j * 4, j * 4 + 4), " ")
			}
			if (i + 1 < idArray.length) formattedBitArray.push(" | ")
		}
	}

	encoded = bitArray.join("")
	decode()
	if (brackets) document.getElementById("bitarray").innerHTML = formattedBitArray.join("")
	if (!brackets) document.getElementById("bitarray").innerHTML = encoded
	document.getElementById("outin").innerHTML = formattedarray.join("")
	document.getElementById("out").innerHTML = decoded.join("")
	document.getElementById("ascii").innerHTML = ascii2bin(og)

	endTime = Date.now()
	timeDelta = endTime-startTime

	document.getElementById("stats").innerHTML =
		"<br>NLC Size - " + encoded.length +
		"<br>ASCII Size - " + ascii2bin(og).length +
		"<br>Ratio - " + ascii2bin(og).length / encoded.length + " : 1" +
		"<br>Time - " + timeDelta + "ms"

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
		idArray.push(bin2dec(encoded.substring(j + 3, j + 4 * indexArray[i] + 3)))
		j = j + 4 * indexArray[i]
	}

	// Convert IDs to content
	for (let i = 0; i < idArray.length; i++) {
		decoded.push(idLookup[idArray[i]].replace("\n", "<br>"))
		
		// If word followed by word, place space
		if (words.includes(idLookup[idArray[i]]) && (words.includes(idLookup[idArray[i + 1]]) || specialIDs.includes(idLookup[idArray[i+1]]))) decoded.push(" ")
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
