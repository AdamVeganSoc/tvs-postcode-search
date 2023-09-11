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
            const location = data.result.admin_county ? `${data.result.admin_county} County Council` : data.result.admin_district;

            let HTML = '<div style="margin-top:1.5rem;">We are sorry but the unitary authority or county council associated with your postcode could not be found.</div>'; // The output to display for the search results.

            // 3) Fetch CSV data
            Papa.parse("./data/data.csv", {
                download: true,
                header: true,
                delimiter: ',',
                complete: function (results) {

                    console.log(location);

                    // 4) Match CSV data with "nuts" data as closely as possible
                    const csvRow = results.data.find(row => row.loc.trim().toLowerCase() === location.trim().toLowerCase());

                    if (csvRow) {
                        HTML = `<div style="margin-top:1.5rem;"><h2>${csvRow.name}</h2><p>${csvRow.description}</p></div>`;
                    }

                    // Output the HTML result
                    document.querySelector('#search-results').innerHTML = HTML;

                }
            });

        });

    });

})();