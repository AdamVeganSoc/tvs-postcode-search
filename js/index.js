(function () {

    window.addEventListener("load", function () {

        document.querySelector("form").addEventListener("submit", async function (evt) {

            evt.preventDefault();

            // 1) Fetch from postcodes.io
            const postcode = "B3 1UR"
            const endPoint = `https://api.postcodes.io/postcodes/${postcode}`;
            const response = await fetch(endPoint);
            const data = await response.json();

            // 2) Get the "nuts" data
            const nuts = data.result.nuts;

            // 3) Fetch CSV data

            // 4) Match CSV data with "nuts" data as closely as possible

            // 5) Pull the CSV data for the location

        });

    });

})();