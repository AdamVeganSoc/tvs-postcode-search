/*

TODO
----
Embed writetothem (if possible)
For GREEN councils - write to local MP instead of council
Embed template letter text into the page itself
Auto-format notes for each council
Update data to latest CSV
Make writetothem open in new tab

*/

(function () {

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
    
    const writeHandler = function (event) {
        event.preventDefault();
    
        window.parent.postMessage({
            action: "linkClicked",
            url
        }, "https://www.vegansociety.com");
    };

    const formatResponse = function (response) {
        // Clean the response
        let formattedResponse = "";

        const questions = [
            {
                number: "1.",
                start: "with regard to the public sector equality duty",
                end: "purpose of the equality act 2010?",
                postfix: "(yes/no)"
            },
            {
                number: "2.",
                start: "how many vegan hot",
                end: "options do you offer:",
                postfix: ""
            },
            {
                number: "3.",
                start: "is a requirement for providing vegan hot",
                end: "homes, libraries, and any other public buildings?",
                postfix: "(yes/no)"
            },
            {
                number: "4.",
                start: "has your organisation taken any action to reduce meat",
                end: "in order to meet environmental goals?",
                postfix: "(yes/no)"
            }
        ];

        // Try to detect the questions in a response
        const questionsDetected = [];
        questions.forEach((question, i) => {
            const res = response.toLowerCase().trim();
            const number = res.indexOf(question.number);
            const start = res.indexOf(question.start);
            const end = res.indexOf(question.end);
            if (number || number && start && end || start && end) {
                questionsDetected.push({
                    question: i,
                    num: {
                        start: number,
                        end: number >= 0 ? number + question.number.length : -1
                    },
                    words: {
                        start,
                        end: end >= 0 ? end + question.end.length : -1
                    }
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
            if (i !== questionsDetected.length-1) {
                // This isn't the last question.
                endRSlice = questionsDetected[i+1].num.start !== -1 ? questionsDetected[i+1].num.start-1 : questionsDetected[i+1].words.start-1;
            }

            // Slice the question from the responses
            questionDetected.raw = {
                q: response.slice(startQSlice, endQSlice),
                r: endRSlice ? response.slice(startRSlice, endRSlice) : response.slice(startRSlice)
            }
        });

        // Prep the formatted response
        questionsDetected.forEach(questionDetected => {
            formattedResponse += `<h2>${questionDetected.raw.q}</h2>`;
            formattedResponse += `<p>${questionDetected.raw.r}</p>`;
        });

        return formattedResponse;
    }

    window.addEventListener("load", function () {

        document.querySelector("form").addEventListener("submit", async function (evt) {

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

            // Clear the search results
            document.querySelector('#search-results').innerHTML = "";

            if (data.status === 404) {
                document.querySelector('#search-results').innerHTML = `<div style="margin-top:1.5rem;">Invalid postcode</div>`;
                return;
            }

            // 2) Get the "nuts" data
            const location = data.result.admin_county ? data.result.admin_county : data.result.admin_district;
            let type = data.result.admin_county ? 'DIW' : 'UTW';
            
            mtws.forEach(met => {
                if (location.trim().toLowerCase().includes(met.trim().toLowerCase())) {
                    type = 'MTW';
                } 
            });

            let HTML = '<div style="margin-top:1.5rem;">We are sorry but the unitary authority or county council associated with your postcode could not be found.</div>'; // The output to display for the search results.
            let allowWrite = false;

            // 3) Fetch CSV data
            Papa.parse("./data/data.csv", {
                download: true,
                header: true,
                delimiter: ',',
                complete: function (results) {
                    // 4) Match CSV data with "nuts" data as closely as possible
                    const csvRow = results.data.find(row => row.name.trim().toLowerCase().includes(location.trim().toLowerCase()));

                    if (csvRow) {
                        allowWrite = true;
                        HTML = `
                            <div style="margin-top:1.5rem;">
                                <h2>${csvRow.name}</h2>
                                <p><strong>Our rating:</strong> <span class="rating ${csvRow.rating.toLowerCase()}-rating">${csvRow.rating}</span></p>
                                ${formatResponse(csvRow.responses)}
                            </div>`;
                    }

                    // Output the HTML result
                    document.querySelector('#search-results').innerHTML = HTML;

                    // Get the document height
                    const docHeight = document.body.scrollHeight;

                    // Send the page height out to a parent window
                    window.parent.postMessage({
                        action: "adjustHeight",
                        height: docHeight
                    }, "https://www.vegansociety.com");

                    const url = `https://www.writetothem.com/write?pc=${data.result.postcode}&type=${type}&a=council&who=all`;

                    if (allowWrite) {
                        writeLink.classList.remove('disabled'); 
                        writeLink.addEventListener("click", writeHandler);
                    }

                }
            });

        });

    });

})();

/*
1. Yes. 2. Daily meal, vegetarian and vegan choices for school meals and vegetarian and vegan options for event catering. 3. No staff canteen 4. More. Fluctuates depending on client requirements 5. Yes 6. Yes. CITYSERVE are striving to deliver “plant-based” menus, this includes a variety of meat and non-meat options as well as a commitment to reducing waste and assurances of sustainability from our suppliers.

1. With regard to the Public Sector Equality Duty, does your decision-making regarding the provision of food take into account the fact that veganism is a protected characteristic for the purpose of the Equality Act 2010? Yes/No Yes 2. How many vegan hot and cold meal options do you offer: • In your own local authority canteen every day (if you have one)? 0, 1, 2, 3 or more. Please also express this as a proportion of the overall number of options offered.  Oxfordshire County Council do not have a local authority canteen or catering outlet • In external events catering (if applicable)? Eg: 0, 1, 2, 3 or more. Please also express this as a proportion of the overall number of options offered. Oxfordshire County Council Catering Services provide school meals in 57 Primary schools and do not cater for external events. For our school meal menus, at least one of the three main meal options daily is a Vegan dish. The only other catering provided is for internal Full Council events, for which we engage an external supplier – these menus are 100% plant based 3. Is a requirement for providing vegan hot and cold meal options included within the catering procurement contracts you issue for other catering provision for which you are responsible including schools, leisure centres, care homes, libraries, and any other public buildings?  Yes/No Oxfordshire County Council only provide school lunches in 57 Primary schools. All other schools make their own catering arrangements, and the information may be held by individual schools. Schools are public authorities in their own right under the Freedom of Information Act and I would therefore suggest that you contact them directly to request this information. I have provided a link to our website where you can find the contact details of the schools within our area. http://www.oxfordshire.gov.uk/cms/schools/query Leisure centres, Libraries, care homes and any other public buildings will either make their own arrangements or the service will be provided by the district council and this information is not held by Oxfordshire County Council. 4. Has your organisation taken any action to reduce meat and dairy consumption in order to meet environmental goals? •If yes, please detail what actions have been taken, e.g. 100% or 50% plant-based food options offered. •If no, do you have ambitions to take action in this area, eg through setting meat reduction targets? Yes/no, if yes please detail what ambitions you have set out. Oxfordshire County Council’s Catering Service has increased the number of plant based / Vegan and vegetarian meal choices on the menu. Of the 45 main courses available in the current menu cycle only 14 contain meat and 14 choices are dairy free. The service is looking to reduce the meat content of some dishes further, for future menu cycles

With regard to the Public Sector Equality Duty, does your decision-making regarding the provision of food take into account the fact that veganism is a protected characteristic for the purpose of the Equality Act 2010? Yes/No Yes How many vegan hot and cold meal options do you offer: In your own local authority canteen every day (if you have one)? 0, 1, 2, 3 or more. Please also express this as a proportion of the overall number of options offered.  Not applicable, the Council does not have a canteen. In external events catering (if applicable)? Eg: 0, 1, 2, 3 or more. Please also express this as a proportion of the overall number of options offered.   Not applicable, the Council does not offer external events catering. Is a requirement for providing vegan hot and cold meal options included within the catering procurement contracts you issue for other catering provision for which you are responsible including schools, leisure centres, care homes, libraries, and any other public buildings?  Yes/No The Council does not have any catering contracts for this provision. Where catering is provided it is delivered via inhouse services. The Council’s City Catering Service delivers catering to those schools who wish to buy this service and vegan diets are catered for, and this is also the case for other provision such as in children’s care homes. Has your organisation taken any action to reduce meat and dairy consumption in order to meet environmental goals? ·        If yes, please detail what actions have been taken, e.g. 100% or 50% plant-based food options offered. • The council has developed, and is implementing a Food Plan for the city, which aims to make Leicester “a healthy and sustainable food city”. The six ambitions of the plan include: “Transforming food procurement and catering” (ambition 5) and “Promoting sustainable food and addressing the climate emergency” (ambition 6). • There is an action in the current Food Plan Action Plan to develop a ‘good food procurement policy’ • In response to the ambitions in the current (and previous) Food Plans, the council’s in-house provider for schools catering – City Catering – has achieved the Soil Association’s Food for Life Served Here silver award. From a climate change perspective, the award has seasonal and local sourcing requirements, as well as points available for ethical sourcing and the introduction of pulses and vegetables to menus, although it doesn’t have any specific requirements to reduce meat and dairy • The Sustainable Schools Team has delivered a Low Carbon Lunches project in 15 schools ·        If no, do you have ambitions to take action in this area, eg through setting meat reduction targets? Yes/no, if yes please detail what ambitions you have set out. Not applicable.
*/