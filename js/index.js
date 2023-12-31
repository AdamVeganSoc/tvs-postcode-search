/*

TODO
----
Update data to latest CSV
*/

(function() {

    let url,
        type,
        a = "council";

    let templateLetterCouncil,
        templateLetterMP,
        petitionLink;

    const mtws = [
        "Liverpool",
        "Knowsley",
        "St Helens",
        "Sefton",
        "Wirral",
        "Manchester",
        "Bolton",
        "Bury",
        "Oldham",
        "Rochdale",
        "Salford",
        "Stockport",
        "Tameside",
        "Trafford",
        "Wigan",
        "Sheffield",
        "Barnsley",
        "Doncaster",
        "Rotherham",
        "Newcastle upon Tyne",
        "Gateshead",
        "South Tyneside",
        "North Tyneside",
        "Sunderland",
        "Birmingham",
        "Coventry",
        "Dudley",
        "Sandwell",
        "Solihull",
        "Walsall",
        "Wolverhampton",
        "Leeds",
        "Bradford",
        "Calderdale",
        "Kirklees",
        "Wakefield"
    ];

    const lbws = [
        "Barking and Dagenham",
        "Barnet",
        "Bexley",
        "Brent",
        "Bromley",
        "Camden",
        "Croydon",
        "Ealing",
        "Enfield",
        "Greenwich",
        "Hackney",
        "Hammersmith and Fulham",
        "Haringey",
        "Harrow",
        "Havering",
        "Hillingdon",
        "Hounslow",
        "Islington",
        "Kensington and Chelsea",
        "Kingston upon Thames",
        "Lambeth",
        "Lewisham",
        "Merton",
        "Newham",
        "Redbridge",
        "Richmond upon Thames",
        "Southwark",
        "Sutton",
        "Tower Hamlets",
        "Waltham Forest",
        "Wandsworth",
        "Westminster"
    ];

    const populateTemplates = function () {
        // Populate the template letters
        const councilDiv = document.getElementById('templateLetterCouncil');
        if (councilDiv && !templateLetterCouncil) templateLetterCouncil = councilDiv.innerHTML.trim().replace(/    |  |\t/g, "");
        const mpDiv = document.getElementById('templateLetterMP');
        if (mpDiv && !templateLetterMP) templateLetterMP = mpDiv.innerHTML.trim().replace(/    |  |\t/g, "");
        const petitionDiv = document.getElementById('petitionLink');
        if (petitionDiv && !petitionLink) petitionLink = petitionDiv.innerHTML.trim();
    };

    const gradingText = {
        green: "has taken demonstrable steps to be inclusive of veganism and to address meat and dairy consumption.",
        amber: "has taken only limited steps to be inclusive of veganism and to address meat and dairy consumption.",
        red: "has not taken steps to be inclusive of veganism and/or to address meat and dairy consumption."
    };

    const writeHandler = function(event) {
        event.preventDefault();

        window.parent.postMessage({
            action: "linkClicked",
            url
        }, "*");
    }

    const copyTextToClipboard = function(event) {
        // Use the Clipboard API to write the text to the clipboard
        populateTemplates();
        navigator.clipboard.writeText(a === 'council' ? templateLetterCouncil : templateLetterMP)
            .then(() => {
                document.getElementById('copiedText').innerHTML = "copied!";
                adjustHeight();
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
            });
    }

    const cutSubstring = function(s, startIndex, endIndex) {
        return s.substring(0, startIndex) + s.substring(endIndex);
    };

    const adjustHeight = function() {
        // Get the document height
        const docHeight = document.body.scrollHeight;

        // Send the page height out to a parent window
        window.parent.postMessage({
            action: "adjustHeight",
            height: docHeight
        }, "*");
    };

    const formatResponse = function(response) {

        response = response.replace("Q1.", "1.")
                        .replace("Q2.", "2.")
                        .replace("Q3.", "3.")
                        .replace("Q4.", "4.")
                        .replace("A1.", "")
                        .replace("A2.", "")
                        .replace("A3.", "")
                        .replace("A4.", "");

        // Clean the response
        let formattedResponse = "";

        const questions = [{
            number: "1.",
            start: "with regard to the public sector equality duty",
            end: "purpose of the equality act 2010?",
            postfix: "yes/no"
        }, {
            number: "2.",
            start: "how many vegan hot",
            end: "options do you offer:",
            postfix: ""
        }, {
            number: "3.",
            start: "is a requirement for providing vegan hot",
            end: "homes, libraries, and any other public buildings?",
            postfix: "yes/no"
        }, {
            number: "4.",
            start: "has your organisation taken any action to reduce meat",
            end: "in order to meet environmental goals?",
            postfix: "yes/no"
        }, {
            number: "5.",
            start: "-----",
            end: "-----",
            postfix: ""
        }, {
            number: "6.",
            start: "-----",
            end: "-----",
            postfix: ""
        }, {
            number: "7.",
            start: "-----",
            end: "-----",
            postfix: ""
        }, {
            number: "8.",
            start: "-----",
            end: "-----",
            postfix: ""
        }, {
            number: "9.",
            start: "-----",
            end: "-----",
            postfix: ""
        }, {
            number: "10.",
            start: "-----",
            end: "-----",
            postfix: ""
        }];

        // Try to detect the questions in a response
        const questionsDetected = [];
        questions.forEach((question, i) => {
            const res = response.toLowerCase().trim().replace (/[\t\n\r]/g, ' ');
            let number = res.indexOf(question.number);
            let start = res.indexOf(question.start);
            let end = res.indexOf(question.end);

            // If the number if found and it is not at the beginning of the string.
            if (number !== -1 && number !== 0) {
                // Check the character prior to make sure this is a question number.
                const char = res.charAt(number-1);
                if (char !== " ") number = -1; // Clear the number if it doesn't have a space before it.
            }

            if (number !== -1 || (start !== -1 && end !== -1)) {
                questionsDetected.push({
                    question: i,
                    num: {
                        start: number,
                        end: number >= 0 ? number + question.number.length : -1
                    },
                    words: {
                        start,
                        end: end >= 0 ? end + question.end.length : -1
                    },
                    postfix: question.postfix
                });
            }
        });

        // If no questions have been detected
        if (questionsDetected.length === 0) return `<p>${formattedResponse}</p>`;

        // If questions have been detected - extract them
        questionsDetected.forEach((questionDetected, i) => {
            // Set where to begin question slicing from
            let startQSlice = 0;
            if (questionDetected.num.start !== -1) startQSlice = questionDetected.num.start;
            else if (questionDetected.words.start !== -1) startQSlice = questionDetected.words.start;

            // Set where to end question slicing from
            let endQSlice = 0;
            if (questionDetected.words.end !== -1) endQSlice = questionDetected.words.end;
            else if (questionDetected.num.end !== -1) endQSlice = questionDetected.num.end;

            // Now set where to start the response slicing from
            let startRSlice = endQSlice + 1;

            // Now set the end to the response slicing
            let endRSlice;
            if (i !== questionsDetected.length - 1) {
                // This isn't the last question.
                endRSlice = questionsDetected[i + 1].num.start !== -1 ? questionsDetected[i + 1].num.start - 1 : questionsDetected[i + 1].words.start - 1;
            }

            // Slice the question from the responses
            questionDetected.raw = {
                q: response.slice(startQSlice, endQSlice),
                r: endRSlice ? response.slice(startRSlice, endRSlice) : response.slice(startRSlice)
            }
        });

        // Prep the formatted response
        questionsDetected.forEach((questionDetected, i) => {
            let res = questionDetected.raw.r;

            // Detect the question postfix
            if (questionDetected.postfix !== "") {
                const postfixIndex = questionDetected.raw.r.toLowerCase().trim().indexOf(questionDetected.postfix);

                if (postfixIndex !== -1) {
                    res = cutSubstring(res, postfixIndex, postfixIndex + 1 + questionDetected.postfix.length);
                }
            }

            const openingTag = i === 0 ? '<p><span class="quotemark start">"</span>' : '<p>';
            const closingTag = i === questionsDetected.length - 1 ? '<span class="quotemark end">"</span></p>' : "</p>";
            formattedResponse += `${openingTag}<strong>${questionDetected.raw.q}</strong> `;
            formattedResponse += `${res.replace(/[]/g, "")}${closingTag}`;
        });

        return formattedResponse.replace(/        /g, ' ').replace(/•|·/g, '<br>');
    }

    window.addEventListener("load", function() {

        populateTemplates();

        // Set up the copy-paste button
        document.getElementById('copyPaste').addEventListener("click", copyTextToClipboard);

        setTimeout(function() {
            // Send the page height out to a parent window
            adjustHeight();
        }, 500);

        document.querySelector("form").addEventListener("submit", async function(evt) {

            populateTemplates();

            evt.preventDefault();

            // 1) Fetch from postcodes.io
            const postcode = document.querySelector('#postcode').value;
            const endPoint = `https://api.postcodes.io/postcodes/${postcode}`;
            const response = await fetch(endPoint);
            const data = await response.json();

            // Set up the write to councillors link
            const writeLink = document.querySelector("#writeToThem");
            writeLink.removeEventListener("click", writeHandler);
            writeLink.classList.add('disabled');
            writeLink.setAttribute('href', '#');
            writeLink.setAttribute('target', '_self');

            // Clear the search results
            document.querySelector('#search-results').innerHTML = "";

            if (data.status === 404) {
                document.querySelector('#search-results').innerHTML = `<div style="margin-top:1.5rem;">Invalid postcode</div>`;
                return;
            }

            // 2) Get the "nuts" data
            const location = data.result.admin_county ? data.result.admin_county : data.result.admin_district;
            type = data.result.admin_county ? 'DIW' : 'UTW';

            // Check for metropolitan areas
            mtws.forEach(met => {
                if (location.trim().toLowerCase().includes(met.trim().toLowerCase())) {
                    type = 'MTW';
                }
            });

            // Check for London boroughs
            lbws.forEach(lon => {
                if (location.trim().toLowerCase().includes(lon.trim().toLowerCase())) {
                    type = 'LBW';
                }
            });

            let HTML = '<div style="margin-top:1.5rem;">We are sorry but the unitary authority or county council associated with your postcode could not be found.</div>'; // The output to display for the search results.
            let allowWrite = false;

            // 3) Fetch CSV data
            Papa.parse("./data/data.csv", {
                download: true,
                header: true,
                delimiter: ',',
                complete: function(results) {
                    // 4) Match CSV data with "nuts" data as closely as possible
                    const csvRow = results.data.find(row => row.name.trim().toLowerCase().includes(location.trim().toLowerCase()));

                    a = 'council'; // either council or MPs

                    if (csvRow) {
                        allowWrite = true;
                        a = csvRow.rating.toLowerCase() === 'green' ? 'westminstermp' : 'council';
                        
                        if (a === "council") {
                            url = `https://www.writetothem.com/write?pc=${data.result.postcode}&type=${type}&a=council&who=all`;
                        } else if (a === "westminstermp") {
                            url = `https://www.writetothem.com/?a=westminstermp&pc=${data.result.postcode}`;
                        }
                        
                        writeLink.innerHTML = `Write to your local ${a === 'westminstermp' ? 'MP' : 'councillors' }`;
                        HTML = `
                            <div style="margin-top:1.5rem;">
                                <h2>${csvRow.name}</h2>
                                <p><strong>Your council was graded:</strong> <span class="rating ${csvRow.rating.toLowerCase()}-rating">${csvRow.rating}</span></p>
                                <p><strong>This means your council:</strong> ${gradingText[csvRow.rating.toLowerCase()]}</p>
                                <p>What your council told us in response to The Vegan Society’s FOI request:</p>
                                <div class="responses">${formatResponse(csvRow.responses)}</div>
                                <p>If you have already <a class="bottom-link" href="${url}" target="_blank">written to your representatives</a>, please consider signing our <a href="${petitionLink}" target="_blank">petition</a>.</p>
                            </div>`;
                    }

                    // Output the HTML result
                    document.querySelector('#search-results').innerHTML = HTML;

                    adjustHeight();

                    if (allowWrite) {
                        writeLink.classList.remove('disabled');
                        //writeLink.addEventListener("click", writeHandler);
                        writeLink.setAttribute('href', url);
                        writeLink.setAttribute('target', '_blank');
                    }

                }
            });

        });

    });

})();