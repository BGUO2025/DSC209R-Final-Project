// Set up SVG dimensions
const width = 600;
const height = 600;

const svg = d3.select("#globe-svg");

const projection = d3.geoOrthographic()
    .scale(250)
    .translate([width / 2, height / 2])
    .clipAngle(90);

const path = d3.geoPath().projection(projection);

// Draw the globe sphere
svg.append("path")
    .datum({type: "Sphere"})
    .attr("d", path)
    .attr("fill", "#1b263b")
    .attr("stroke", "#ffffff");

// Load world data
d3.json("https://unpkg.com/world-atlas@2/countries-110m.json").then(worldData => {
    const countries = topojson.feature(worldData, worldData.objects.countries);

    svg.selectAll(".country")
        .data(countries.features)
        .enter()
        .append("path")
        .attr("class", "country")
        .attr("d", path)
        .attr("fill", "#214598")
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5);

    // Sample earthquake points
    const earthquakes = [
        { lat: 35, lng: 139 },   // Japan
        { lat: 37, lng: -122 },  // California
        { lat: -16, lng: -72 }   // Peru
    ];

    svg.selectAll(".quake")
        .data(earthquakes)
        .enter()
        .append("circle")
        .attr("class", "quake")
        .attr("cx", d => projection([d.lng, d.lat])[0])
        .attr("cy", d => projection([d.lng, d.lat])[1])
        .attr("r", 5)
        .attr("fill", "red")
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .on("mouseover", function(event, d) {
            d3.select(this).attr("r", 8).attr("fill", "orange");
        })
        .on("mouseout", function(event, d) {
            d3.select(this).attr("r", 5).attr("fill", "red");
        });
});

// Auto-rotation
let rotate = [0, 0];
d3.timer(function(elapsed) {
    rotate[0] = elapsed * 0.02; // rotate around vertical axis
    projection.rotate(rotate);
    svg.selectAll("path").attr("d", path);
    svg.selectAll("circle")
        .attr("cx", d => projection([d.lng, d.lat])[0])
        .attr("cy", d => projection([d.lng, d.lat])[1]);
});
