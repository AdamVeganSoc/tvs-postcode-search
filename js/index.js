(function () {

    window.addEventListener("load", function () {

        document.querySelector("form").addEventListener("submit", async function (evt) {

            evt.preventDefault();

            // 1) Fetch from postcodes.io
            const postcode = document.querySelector('#postcode').value;
            const endPoint = `https://api.postcodes.io/postcodes/${postcode}`;
            const response = await fetch(endPoint);
            const data = await response.json();

            // 2) Get the "nuts" data
            const nuts = data.result.nuts;

            // 3) Fetch CSV data
            Papa.parse("./data/data.csv", {
                download: true,
                header: true,
                delimiter: ',',
                complete: function (results, file) {
                    
                    console.log(data.result, nuts.trim().toLowerCase());

                    // 4) Match CSV data with "nuts" data as closely as possible
                    const csvRow = results.data.find(row => row.nuts.trim().toLowerCase() === nuts.trim().toLowerCase());

                    console.log("Search result:", csvRow);

                }
            });

        });

    });

})();