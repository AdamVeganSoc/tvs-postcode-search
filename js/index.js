/*

TODO
----
Embed writetothem (if possible)
Large writetothem button
Writetothem button present but greyed out before searching
Move to writetothem in a new tab
Increase the size of the postcode search field text
For GREEN councils - write to local MP instead of council
Embed template letter text into the page itself
Auto-format notes for each council

*/

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

(function () {

    window.addEventListener("load", function () {

        document.querySelector("form").addEventListener("submit", async function (evt) {

            evt.preventDefault();

            // 1) Fetch from postcodes.io
            const postcode = document.querySelector('#postcode').value;
            const endPoint = `https://api.postcodes.io/postcodes/${postcode}`;
            const response = await fetch(endPoint);
            const data = await response.json();

            if (data.status === 404) {
                document.querySelector('#search-results').innerHTML = `<div style="margin-top:1.5rem;">Invalid postcode</div>`;
                return;
            }

            console.log(data.result);

            // 2) Get the "nuts" data
            const location = data.result.admin_county ? data.result.admin_county : data.result.admin_district;
            let type = data.result.admin_county ? 'DIW' : 'UTW';
            
            mtws.forEach(met => {
                if (location.trim().toLowerCase().includes(met.trim().toLowerCase())) {
                    type = 'MTW';
                } 
            });

            let HTML = '<div style="margin-top:1.5rem;">We are sorry but the unitary authority or county council associated with your postcode could not be found.</div>'; // The output to display for the search results.

            // 3) Fetch CSV data
            Papa.parse("./data/data.csv", {
                download: true,
                header: true,
                delimiter: ',',
                complete: function (results) {
                    // 4) Match CSV data with "nuts" data as closely as possible
                    const csvRow = results.data.find(row => row.name.trim().toLowerCase().includes(location.trim().toLowerCase()));

                    if (csvRow) {
                        HTML = `
                            <div style="margin-top:1.5rem;">
                                <h2>${csvRow.name}</h2>
                                <p><strong>Our rating:</strong> <span class="rating ${csvRow.rating.toLowerCase()}-rating">${csvRow.rating}</span></p>
                                <p><a id="writeToThem" href="#">Write to your local councillors</a></p>
                                <p>${csvRow.responses}</p>
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

                    const writeLink = document.querySelector("#writeToThem");
                    const url = `https://www.writetothem.com/write?pc=${data.result.postcode}&type=${type}&a=council&who=all`;

                    writeLink.addEventListener("click", function (event){
                        event.preventDefault();

                        window.parent.postMessage({
                            action: "linkClicked",
                            url
                        }, "https://www.vegansociety.com");
                    });

                }
            });

        });

    });

})();