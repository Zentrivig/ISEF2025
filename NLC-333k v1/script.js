const specialIDs = [ // Letters sorted by frequency on https://en.wikipedia.org/wiki/Letter_frequency
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
	"\n"
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
	"\n"
]

let encoded = ""
let decoded = []
let formattedarray = []

const wordsbitsize = Math.ceil(dec2bin(words.length, 0).length / 4)

function setup() {
	refresh()
}

function draw() {
	//    refresh()
}

function refresh() {
	let og = ""
	let ogarray = []
	let idArray = []
	formattedarray = []
	let bitArrayIndex = []
	let bitArray = []
	let idbitsize = 0

	og = document.getElementById("og").value
	ogarray = og.split(" ")
	for (let i = 0; i < ogarray.length; i++) {
		/*
		You => you => 310
		asDf => asdf => 2,7,9,11
		*/
		if (words.indexOf(ogarray[i].toLowerCase()) == -1) {
			let wordarray = ogarray[i].split('')
			for (let j = 0; j < wordarray.length; j++) {
				if (specialIDs.indexOf(wordarray[j].toLowerCase()) == -1) {
					idArray.push(specialIDs.indexOf("�"))
				} else {
					idArray.push(specialIDs.indexOf(wordarray[j].toLowerCase()))
				}
			}
			formattedarray.push(`<span style="color: red;">${ogarray[i]}</span>`)
		} else {
			idArray.push(words.indexOf(ogarray[i].toLowerCase()) + specialIDs.length)
			idbitsize = Math.ceil(dec2bin(words.indexOf(ogarray[i].toLowerCase()) + specialIDs.length, 0).length / 4)
			formattedarray.push(`<span style="color: rgb(${(idbitsize) * 255 / wordsbitsize},255,${(idbitsize) * 255 / wordsbitsize}">${ogarray[i]}</span>`)
		}
	}
	
	for (let i = 0; i < idArray.length; i++) {
		bitArrayIndex.push(dec2bin(Math.ceil(dec2bin(idArray[i], 0).length / 4), 3))
	}
	bitArrayIndex.push("000")
	for (let i = 0; i < idArray.length; i++) {
		/*
		dec2bin(310,0) =>
		"100110110" length = 9 (lead to the nearest 4-bit boundary: should be 12)
		4*floor(x/4+1)
		9 => 12
		dec2bin(310,12) => "000100110110" length = 12
		*/
		bitArray.push(dec2bin(idArray[i], 4 * Math.ceil(dec2bin(idArray[i], 0).length / 4)))
	}

	encoded = bitArrayIndex.join("") + bitArray.join("")
	decode()
	document.getElementById("bitarray").innerHTML = encoded
	document.getElementById("outin").innerHTML = formattedarray.join(" ")
	document.getElementById("out").innerHTML = decoded.join(" ")
	document.getElementById("ascii").innerHTML = ascii2bin(og)

	document.getElementById("stats").innerHTML =
		"<br>NLC Size - " + encoded.length +
		"<br>ASCII Size - " + ascii2bin(og).length +
		"<br>Ratio - " + ascii2bin(og).length / encoded.length + " : 1"


}

function decode() {
	let bitArrayIndex = []
	let bitArray = []
	let i = 0
	decoded = []
	while (true) {
		if (encoded.substring(3 * i, 3 * i + 3) == "000") break
		bitArrayIndex.push(bin2dec(encoded.substring(3 * i, 3 * i + 3)))
		i++
	}
	let startpoint = bitArrayIndex.length * 3 + 3
	for (let i = 0; i < bitArrayIndex.length; i++) {
		bitArray.push(encoded.substring(startpoint, startpoint + 4 * bitArrayIndex[i]))
		startpoint = startpoint + 4 * bitArrayIndex[i]
	}
	for (let i = 0; i < bitArray.length; i++) {
		decoded.push(words[bin2dec(bitArray[i]) - specialIDs.length])
		decoded.push(specialIDs[bin2dec(bitArray[i])])
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