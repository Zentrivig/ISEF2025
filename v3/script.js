/*
Author:	Brian Heers
ISEF 2025 NLCv3 script.js

 * An implementation of Natural Language Compression (NLC), a method to encoding and decoding natural language as binary in JavaScript.
 * A demo is available at isef.heers.net/v3.

*/

// Special characters not monospaced in VS Code
const XON = "␑" // Space override (ASCII Device Control One (XON)) is set as a constant, because ␑ is difficult to type and not monospaced
const DC2 = "␒" // No space override (ASCII Device Control Two (DC2)) is set as a constant, because ␒ is difficult to type and not monospaced
const SUB = "�" // Unknown substitute character to substitute any unencodable lexemes

// Global settings
let liveEncode
let wordModelGlobal
let brackets
let forceDetailed
let encoded

// Testing for single-letter lexeme placement (errorWord) (now deprecated)
let errorWords = []
let totalWords = 0

// Letters sorted by frequency on https://en.wikipedia.org/wiki/Letter_frequency
let freqLetters = ["e", "t", "a", "o", "n", "r", "i", "s", "h", "d", "l", "f", "c", "m", "u", "g", "y", "p", "w", "b", "v", "k", "j", "x", "z", "q"]

//document.getElementById("og").value = "" // Debug a specific string

// Global scope variables
let formattedArray = []

changeSettings()

/** Autofills the textarea with a randomly selected sentence from the webSentences dataset (either 10k or 300k, however it is set in the HTML) */
function newSentence() {
	document.getElementById("og").value = sampleSentences[Math.floor(Math.random() * sampleSentences.length)]//.toLowerCase()
	encodeLive()
}

/** Updates all settings whenever a setting is changed on the HTML, and encodes the input with the new settings if liveEncode is enabled*/
function changeSettings() {
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

/** Decodes NLCv3 binary into natural language. Takes the encoded binary and dataset to decode with. The datasets must match for successful encoding. 
 * @param {string} encoded - NLCv3 binary
 * @param {object} dataset - NLCv3 dataset
*/
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

	/** Calculates the sum of its arguments. Expects a spreaded array (...[]), NOT a literal array ([]) */
	function sum() {
		let sum = 0
		for (let i = 0; i < arguments.length; i++) {
			sum += arguments[i]
		}
		return sum
	}
}

/** If liveEncode is active, will encode the input textarea */
function encodeLive() {
	if (liveEncode) {
		encodeInput()
	}
}

/** Encodes the input textarea, and updates all relevent HTML elements. Also returns statistics of the encoding. */
function encodeInput() {
	console.clear()
	formattedArray = []

	encoded = encode(document.getElementById("og").value, web15, brackets)
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

/** Encodes the given input, using the specified dataset
 * @param {string} inputString String of natural language, to be encoded
 * @param {Dataset} dataset NLCv3 dataset
 * @param {Boolean} brackets Whether or not to calculate and return a bracketed output
*/
function encode(inputString, dataset, brackets = false) {
	let lexemeArray = optimizeArray(splitIntoArray(inputString))
	let idArray = createIdArray(lexemeArray, dataset)
	let bitArray = createBitArray(idArray, dataset)

	// --- For errorWord testing ---
	/*
	let testArray = [...lexemeArray]
	for (let i = 0; i < testArray.length; i++) {
		if (testArray[i][0] == " ") {
			testArray.splice(i, 1)
		}
	}
	totalWords += testArray.length
	*/
	// --- For errorWord testing ---

	renderColored(lexemeArray, dataset)

	renderTooltips(dataset, bitArray, lexemeArray)

	// Detailed and Undetailed Bracket View
	if (brackets) {
		var formattedBrackets = renderBracketed(bitArray, dataset)
	}

	return {
		default: bitArray.indexes.join("") + bitArray.IDs.join(""),
		bracketed: formattedBrackets
	}

	// Internal-scope functions: renderColored, renderTooltips

	/** Takes a string and an HTML color string to return a colored span tag 
	   * @param {string} string The text to display in the innerHTML
	   * @param {string} colorString The color to display the text as in HTML format (e.g. "rgb(102, 15, 232)")
	*/
	function htmlColor(string, colorString) {
		return `<span style="color: ${colorString};">${string}</span>`
	}

	/** Create the output shown in NLC Encoded when brackets are enabled */
	function renderBracketed(bitArray, dataset) {
		let bitArrayBracketed = bitArray
		let header = [
			"             <i>i</i>: ",
			"        Binary: ",
			"       Decimal: ",
			"Index / Lexeme: "
		]
		let formattedBrackets = [...header] // ["", "", "", "",]

		// --- Index half ---
		for (let i = 0; i < bitArray.indexes.length; i++) {
			// Values to be assigned to headers
			let values = [
				i,
				bitArray.indexes[i],
				bin2dec(bitArray.indexes[i]),
				dataset.indexingScheme[bin2dec(bitArray.indexes[i])]
			]

			// Pad all elements to be flushed left
			let longestElement = 0
			for (let j = 0; j < values.length; j++) {
				longestElement = longestElement < values[j].length ? values[j].length : longestElement
			}
			for (let j = 0; j < values.length; j++) {
				formattedBrackets[j] += String(values[j]).padEnd(longestElement + 1)
			}
		}

		// --- ID half ---
		// Index-ID separators
		formattedBrackets[0] += "  "
		formattedBrackets[1] += "- "
		formattedBrackets[2] += "  "
		formattedBrackets[3] += "  "

		for (let i = 0; i < bitArray.IDs.length; i++) {
			// Values to be assigned to headers
			let values = [
				i,
				bitArray.IDs[i] + (i < (bitArray.IDs.length - 1) ? " |" : ""),
				bin2dec(bitArray.IDs[i]),
				dataset.indexed.lexemes[bin2dec(bitArray.IDs[i])].replace("\n", "\\n")
			]

			// Pad all elements to be flushed left
			let longestElement = 0
			for (let j = 0; j < values.length; j++) {
				longestElement = longestElement < values[j].length ? values[j].length : longestElement
			}
			for (let j = 0; j < values.length; j++) {
				formattedBrackets[j] += String(values[j]).padEnd(longestElement + 1)
			}
		}

		if (formattedBrackets[0].length > screen.width / 9 && !forceDetailed) {
			// If there is too much text for the screen and details aren't being forced, fallback to old bracketed mode: 110 100 - 010000101111101 | 0100001101
			formattedBrackets = bitArrayBracketed.indexes.join(" ") + " - " + bitArray.IDs.join(" | ")
		} else {
			formattedBrackets[1] = htmlColor(formattedBrackets[1], "rgb(192, 255, 192)")
			formattedBrackets = formattedBrackets.join("\n")
		}
		return formattedBrackets
	}

	/** Create tooltips for each lexeme. Directly edits formattedArray. */
	function renderTooltips(dataset, bitArray, lexemeArray) {
		//<span class="tooltip">Hover over me<span class="tooltiptext">Tooltip text</span></span> 
		if (brackets) {
			let offset = 0
			for (let i = 0; i < formattedArray.length; i++) {
				let j = i - offset
				formattedArray[i] = `<span class="tooltip">${formattedArray[i]}<span class="tooltiptext">${[
					`Lexeme:        <b>${lexemeArray[i].replace(XON, "XON (Override: Add Space)").replace(DC2, "DC2 (Override: Remove Space)").replace("\n", "\\n")}</b>`,
					`<i>i</i>:             ${j}`,
					`Length:        ${lexemeArray[i].length}`,
					`Ranking:       ${dataset.indexed.lexemes.indexOf(lexemeArray[i])}`,
					`Ratio Ranking: ${dataset.lexemes.indexOf(lexemeArray[i])}`,
					`Index:         ${bitArray.indexes[j]} -> ${dataset.indexingScheme[bin2dec(bitArray.indexes[j])]}`,
					`ASCII Bits:    ${lexemeArray[i].length * 8}`,
					`NLC Bits:      ${(bitArray.IDs[j] + bitArray.indexes[j]).length} (${bitArray.indexes[j]} + ${bitArray.IDs[j]})`,
					`Ratio:         ${Math.round((lexemeArray[i].length * 8) / (bitArray.IDs[j] + bitArray.indexes[j]).length * 100) / 100}`,
				].join("\n")}</span></span>`
			}
		}
	}

	/** First step on formattedArray, brackets and colors the text */
	function renderColored(lexemeArray, dataset) {
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
				function ns(lex) { return dataset.spaceDefaults.noSpaces.includes(lex) } // No space
				function rs(lex) { return dataset.spaceDefaults.rightSpace.includes(lex) } // Right space
				function ls(lex) { return dataset.spaceDefaults.leftSpace.includes(lex) } // Left space
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

	/** Takes an already created idArray and dataset and returns an object of arrays of binary IDs and indexes
	 * @param idArray Generated by createIdArray()
	 * @param dataset NLCv3 Dataset
	*/
	function createBitArray(idArray, dataset) {
		let indexBitArray = []
		let idBitArray = []
		for (let i = 0; i < idArray.length; i++) {
			let indexAssignment
			for (let j = 0; j < dataset.indexingScheme.length; j++) {
				if (dec2bin(idArray[i], 0).length <= dataset.indexingScheme[j]) {
					indexAssignment = dataset.indexingScheme[j]
					break
				}
			}
			let binaryID = dec2bin(idArray[i], indexAssignment)
			indexBitArray.push(dec2bin(dataset.indexingScheme.indexOf(indexAssignment), dataset.indexAssignmentBitLength))
			idBitArray.push(binaryID)
		}

		return {
			IDs: idBitArray,
			indexes: indexBitArray
		}
	}

	/** Takes an already created lexemeArray and dataset and returns an idArray. In charge of assigning IDs to lexemes and spacing handling as defined in Iteration 3 Write Up
	 * @param lexemeArray Generated by optimizeArray(splitArray(inputString))
	 * @param dataset NLCv3 Dataset
	*/
	function createIdArray(lexemeArray, dataset) {
		let idArray = []
		for (let i = 0; i < lexemeArray.length; i++) {
			let dpr = lexemeArray[i - 2] // Double Previous
			let pre = lexemeArray[i - 1] // Previous
			let cur = lexemeArray[i] // Current
			let nex = lexemeArray[i + 1] // Next
			function ns(lex) { return dataset.spaceDefaults.noSpaces.includes(lex) } // No space
			function rs(lex) { return dataset.spaceDefaults.rightSpace.includes(lex) } // Right space
			function ls(lex) { return dataset.spaceDefaults.leftSpace.includes(lex) } // Left space

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
			} else if (ls(cur) && nex == " ") {
				lexemeArray.splice(i + 1, 0, XON)
				i++
			}
		}


		while (lexemeArray.includes(" ")) {
			lexemeArray.splice(lexemeArray.indexOf(" "), 1)
		}

		for (let i = 0; i < lexemeArray.length; i++) {
			let id = dataset.indexed.lexemes.indexOf(lexemeArray[i])
			if (id == -1) {
				id = dataset.indexed.lexemes.indexOf(SUB)
				console.log("Unencodable")
			}
			idArray.push(id)
		}
		return idArray
	}

	/** Implements Lexeme Determination by Highest-Ratio Substringing (LDHR) by iterating from the highest ratio lexemes to the lowest and progressively splitting the substrings into an array of lexemes. View the LDHR section in v3 Write-Up for more information 
	 * @param {string} input
	*/
	function splitIntoArray(input) {
		function u(unencoded) {
			return [unencoded, "unencoded"]
		}
		function e(encoded) {
			return [encoded, "encoded"]
		}

		/** Searches string for the first instance of stringCondition, and splits it into an array
		 * @param {string} string String to search through
		 * @param {string} stringCondition String to search for
		*/
		function splitFirstInstance(string, stringCondition) {
			return [
				string.substring(0, string.indexOf(stringCondition)),
				string.substring(string.indexOf(stringCondition) + stringCondition.length),
			]
		}

		/** If this is the second pass (resplitting after being optimized), already consider text \\within backslashes\\ to be encoded */
		function preSplit(input) {
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

		let inputArray = []
		if (input.includes("\\")) {
			inputArray.push(...preSplit(input))
		} else {
			inputArray.push(u(input))
		}

		// Splits the string into lexemes by going through the highest ratio words first
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

	/** Some words require optimization: suppose "tone" is being encoded. (tone) is encoded in 18 bits and has a ratio of 1.78, but (to) has a ratio of 2.76, so in the first step of LDHR, [tone] will be split to (to)[ne], and then (to)(ne), which is encoded in 24 bits (001 110 - 101 | 110000111100100), and (ne) alone is 18 bits, which was as much as (tone). optimizeArray iterates through each word and if its LDHR splitting is less efficient than encoding the word as a single word, it marks it to be encoded as a single word. This way, [tone] will first be split to (to)[ne], and then tested if (tone) exists and if it is more efficient, then it will mark (tone) as \\tone\\, meaning it is to be split by itself as it passes everything back to the splitIntoArray function. */
	function optimizeArray(inputArray) {

		/** Searches string for the first instance of stringCondition, and splits it into an array, but includes the stringCondition in the output
		 * @param {string} string String to search through
		 * @param {string} stringCondition String to search for
		*/
		function splitFirstInstanceInclusive(string, stringCondition) {
			toReturn = []

			if (string.substring(0, string.indexOf(stringCondition)) != "") toReturn.push(string.substring(0, string.indexOf(stringCondition)))
			toReturn.push(stringCondition)
			if (string.substring(string.indexOf(stringCondition) + stringCondition.length) != "") toReturn.push(string.substring(string.indexOf(stringCondition) + stringCondition.length))

			return toReturn
		}

		// First split everything by words (characters seperated by spaces)
		let wordArray = inputArray.join("").split(" ")
		for (let i = 0; i < wordArray.length; i++) {
			let testedWord = wordArray[i]
			if (web15.lexemes.includes(testedWord)) {
				// If the word is a lexeme and is more efficiently encoded as a word than through LDHR, it is \\slashMarked\\
				if (simulateLexeme(web15, testedWord).ratio > simulateLexeme(web15, ...splitIntoArray(testedWord)).ratio) {
					wordArray = slashMark(testedWord)
					// (it.) evaluated to \([^\\]||$)(it.)([^\\]||^)\g and . is a wildcard! This bug took 3 hours to discover...
				}
			} else if (testedWord != "" && !testedWord.includes("\\")) {
				// Otherwise, test every possible configuration of up to three lexemes and pick the most efficient split
				let errorWord = testedWord
				let possibleSplits = []
				// Console logs to show progress, because DOM elements cannot be editted during computing
				console.log(`Optimizing: (${errorWord})`)
				let detailedLog = false
				if (errorWord.length > 16) {
					// If the lexeme is significantly long, optimization can take several seconds and require more frequent logs to keep the browser from freezing and the user from getting impatient
					console.log(`Lexeme is ${errorWord.length} characters long,\nOptimization progress:`)
					detailedLog = true
				}
				let testedSubstring
				for (let j = 0; j < errorWord.length; j++) {
					if (detailedLog) {
						console.log(`${Math.round(100 * j / errorWord.length)}% Complete`)
					}
					for (let k = 0; k < errorWord.length; k++) {
						testedSubstring = errorWord.substring(k, errorWord.length - j + k)
						// Split and simulate
						if (simulateLexeme(web15, ...splitFirstInstanceInclusive(errorWord, testedSubstring)).ratio >= simulateLexeme(web15, ...splitIntoArray(errorWord)).ratio) {
							possibleSplits.push({ split: splitFirstInstanceInclusive(errorWord, testedSubstring), ratio: simulateLexeme(web15, ...splitFirstInstanceInclusive(errorWord, testedSubstring)).ratio })
						}
					}
				}
				let highestRatio = possibleSplits[0]
				for (let j = 0; j < possibleSplits.length; j++) {
					highestRatio = possibleSplits[j].ratio > highestRatio.ratio ? possibleSplits[j] : highestRatio
				}
				if (highestRatio != undefined) {
					// Mark the highestRatio word with backslashes
					let toReplace = highestRatio.split.join("")
					let replaceWith = ""
					for (let j = 0; j < highestRatio.split.length; j++) {
						replaceWith += "\\" + highestRatio.split[j] + "\\"
					}
					wordArray = wordArray.join(" ").replaceAll(toReplace, replaceWith).split(" ")
				}
			}
		}

		return splitIntoArray(wordArray.join(" "))

		/** Marks backslashes enveloping the markedWord using RegEx */
		function slashMark(markedWord) {
			return wordArray.join(" ").replaceAll(eval(`/([^\\\\]{1}|^)(${markedWord.replaceAll(/([\^\$\\\.\*\+\?\(\)\[\]\{\}\|\/])/g, "\\$1")})([^\\\\]{1}|$)/g`), "$1\\$2\\$3").split(" ")
		}
	}

	/** A quick function to calculate the amount of bits lexeme(s) will require in NLC and ASCII. Takes a dataset, followed by lexemes to encode. Do not pass an array; only pass spread arrays.
	 * @param dataset NLCv3 Dataset
	 * @param {ArrayIterator} arguments Lexemes to simulate
	*/
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
}

/** Configuring the dataset means taking in a raw dataset (object in the form of {lexemes: [], occurrences: []}), and returning an object containing the “simulation” and the indexingScheme ({...dataset, totalBitsASCII, totalBitsNLC, simulatedRatio, indexingScheme}.) To avoid doing this calculation every time the program is refreshed or run, a preconfigured web-15.js dataset can be created by taking the returned object from datasetConfig, and declaring it as let web15 = {…}. 
 * @param highestIndex The amount of bits it would take to represent the whole dataset in order to trim it to a power of 2
 * @param desiredIndexes desiredIndexes and indexAssignmentBitLength need to work together (desiredIndexes <= 2^indexAssignmentBitLength)
 * @param indexAssignmentBitLength Flat rate of how many bits each word takes up in its index
 * @param {{lexemes: [], occurrences: []}} dataset
*/
function datasetConfig(highestIndex, desiredIndexes, indexAssignmentBitLength, dataset) {
	// specialIDs generated with errorWord testing, occurrences of 0 were made to 2 and sub was made 1, DC2 was placed between XON and "a"
	let specialIDs = {
		chars: [
			XON, DC2, "a", "n", "r", "e", "s", "f", "i", "o", "m", "g", "t", "h", "l", "c", "p", "d", "y", "b", "u", "w", "k", "x", "z", "v", "j", "q", "\n", SUB,
		],
		occurrences: [
			97699, 70530, 43361, 39655, 16772, 13364, 12751, 7848, 7680, 6956, 5507, 5219, 4597, 4123, 3752, 2888, 2220, 1997, 1857, 1412, 1179, 427, 288, 121, 111, 74, 2, 2, 1, 0, 
		]
	}

	// Manually generated list of normal spacing rules for characters and punctuation
	let spaceDefaults = {
		noSpaces: [
			"'",
			"-",
			"\"",
			"\n",
			"n","r","e","f","i","o","m","g","t","h","l","c","p","d","y","b","u","w","k","x","z","v","j","q",
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
			"A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
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

	// Save this state as the indexedVersion before sorting by ratio
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

/** Analyzes the different possible indexing schemes to decide on the one to use for implementation. The parameters were iterated from 15 to 1 for highestIndex, 1 to 3 for indexAssignmentBitLength, and 2^indexAssignmentBitLength and 2^indexAssign-mentBitLength for desiredIndexes. The results of the test are shown in Results of the indexing scheme analysis in the Iteration 3 Write-Up. */
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

function preconfigCopy() {
	navigator.clipboard.writeText("let web15 = " + JSON.stringify(datasetConfig(15, 7, 3, x16webRaw)))
}

function copyBitArray() {
	navigator.clipboard.writeText(encoded.default)
}

/** Returns binary of decimal. dec is decimal input. Length determines necessary leading zeroes. 
 * @param {number} dec Decimal Number
 * @param {number} length The minimum length of the binary output, adds leading zeroes if necessary. Example: dec2bin(19, 8) → 00010011; dec2bin(19,0) → 10011
*/
function dec2bin(dec, length) {
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

/** Returns decimal of binary
 * @param {string} bin Binary number as a string
*/
function bin2dec(bin) {
	let binaryArray = bin.split("")
	let dec = 0
	for (let i = 0; i < binaryArray.length; i++) {
		dec += Math.pow(2, i) * binaryArray[binaryArray.length - i - 1]
	}
	return (dec)
}

/** Returns binary of a string encoded in ASCII
 * @param {string} input
*/
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

/*
// errorWord testing (deprecated)
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
*/

// Data Analysis
let testing = false
function commenceTesting() {
	testing = true
}

let testResults = []

/** When sentence testing is taking place, p5.js is used to continuously update frames after each sentence */
function draw() {
	if (testing) {
		document.getElementById("og").value = sampleSentences[Math.floor(Math.random() * sampleSentences.length)]//.toLowerCase()
		testResults.push(encodeInput())
		document.getElementById("test-stats").innerHTML = [
			`<tr><td>Sentences:</td><td>${testResults.length}</td></tr>`,
		].join("\n")
	}
}

/** Copy the results of the sentence test to the clipboard */
function copyResults() {
	testing = false
	let toCopy = ""
	for (let i = 0; i < testResults.length; i++) {
		let x = testResults[i]
		toCopy += x.input + "\t" + x.bitsNLC + "\t" + x.bitsASCII + "\t" + x.ratio + "\n"
	}
	navigator.clipboard.writeText(toCopy)
}