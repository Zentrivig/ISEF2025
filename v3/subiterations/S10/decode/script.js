const XON = "␑" // Space override (ASCII Device Control One (XON)) is set as a constant, because ␑ is difficult to type and not monospaced
const DC2 = "␒" // No space override (ASCII Device Control One (XON)) is set as a constant, because ␑ is difficult to type and not monospaced
const SUB = "�" // Unknown substitute character to substitute any unencodable lexemes (not monospaced so it's a constant)

function decodeInput() {
	document.getElementById("outin").innerHTML = decode(document.getElementById("og").value, web15)
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