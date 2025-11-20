// ==========================
// GLOBE 1 SETUP
// ==========================
const svg = d3.select("#globe-svg");
const tooltip = d3.select("#globe-tooltip");
const path = d3.geoPath();
const projection = d3.geoOrthographic().clipAngle(90);
let rotate = [0, -20];
let lastX, lastY;

// Draw globe sphere
svg.append("path")
    .datum({ type: "Sphere" })
    .attr("class", "globe-sphere")
    .attr("fill", "#000")
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.5);

const countriesGroup = svg.append("g").attr("class", "countries");

// Load countries
d3.json("https://unpkg.com/world-atlas@2/countries-110m.json").then(worldData => {
    const countries = topojson.feature(worldData, worldData.objects.countries).features;

    countriesGroup.selectAll(".country")
        .data(countries)
        .enter()
        .append("path")
        .attr("class", "country")
        .attr("fill", "#000")
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .on("mouseover", (event, d) => {
            d3.select(event.currentTarget).attr("fill", "#2156e9ff");
            tooltip.text(d.properties.name)
                   .style("display", "block")
                   .style("left", (event.pageX + 10) + "px")
                   .style("top", (event.pageY + 10) + "px");
        })
        .on("mousemove", event => {
            tooltip.style("left", (event.pageX + 10) + "px")
                   .style("top", (event.pageY + 10) + "px");
        })
        .on("mouseout", (event) => {
            d3.select(event.currentTarget).attr("fill", "#000");
            tooltip.style("display", "none");
        });

    resizeGlobe();
});

// Drag to rotate globe 1
svg.call(d3.drag()
    .on("start", event => { lastX = event.x; lastY = event.y; })
    .on("drag", event => {
        const dx = event.x - lastX;
        const dy = event.y - lastY;
        lastX = event.x; lastY = event.y;
        rotate[0] += dx * 0.7;
        rotate[1] -= dy * 0.7;
        rotate[1] = Math.max(-90, Math.min(90, rotate[1]));
        projection.rotate(rotate);
        svg.selectAll("path").attr("d", path);
    })
);

// Responsive resize globe 1
function resizeGlobe() {
    const containerWidth = svg.node().parentNode.getBoundingClientRect().width;
    svg.attr("width", containerWidth).attr("height", containerWidth);
    projection.translate([containerWidth/2, containerWidth/2]).scale(containerWidth/2 * 0.9);
    path.projection(projection);
    svg.select(".globe-sphere").attr("d", path);
    svg.selectAll(".country").attr("d", path);
}
window.addEventListener("resize", resizeGlobe);


// ==========================
// GLOBE 2 SETUP (country detail page)
// ==========================
const svg2 = d3.select("#globe-svg-2");
const projection2 = d3.geoOrthographic().clipAngle(90);
const path2 = d3.geoPath().projection(projection2);
let rotate2 = [0, -20];
let lastX2, lastY2;

svg2.append("path")
    .datum({ type: "Sphere" })
    .attr("class", "globe-sphere")
    .attr("fill", "#000")
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.5);

const countriesGroup2 = svg2.append("g").attr("class", "countries");
const countryMapSvg = d3.select("#country-map");

// Load countries for globe 2
d3.json("https://unpkg.com/world-atlas@2/countries-110m.json").then(worldData => {
    const countries = topojson.feature(worldData, worldData.objects.countries).features;

    countriesGroup2.selectAll(".country")
        .data(countries)
        .enter()
        .append("path")
        .attr("class", "country")
        .attr("fill", "#000")
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .on("mouseover", (event, d) => {
            d3.select(event.currentTarget).attr("fill", "#2156e9ff");
            tooltip.text(d.properties.name)
                   .style("display", "block")
                   .style("left", (event.pageX + 10) + "px")
                   .style("top", (event.pageY + 10) + "px");
        })
        .on("mousemove", event => {
            tooltip.style("left", (event.pageX + 10) + "px")
                   .style("top", (event.pageY + 10) + "px");
        })
        .on("mouseout", (event) => {
            d3.select(event.currentTarget).attr("fill", "#000");
            tooltip.style("display", "none");
        })
        .on("click", (event, d) => {
            // Update right panel text
            d3.select("#country-name").text(d.properties.name);
            d3.select("#country-details").text(`You clicked on ${d.properties.name}.`);

            // Clear previous country map
            countryMapSvg.selectAll("*").remove();

            // Draw the clicked country as zoomed-in map
            const width = countryMapSvg.node().getBoundingClientRect().width;
            const height = countryMapSvg.node().getBoundingClientRect().height;
            const countryProjection = d3.geoMercator()
                                        .fitSize([width, height], d);
            const countryPath = d3.geoPath().projection(countryProjection);

            countryMapSvg.append("path")
                .datum(d)
                .attr("d", countryPath)
                .attr("fill", "#2156e9ff")
                .attr("stroke", "#000")
                .attr("stroke-width", 1);
        });

    resizeGlobe2();
});

// Drag to rotate globe 2
svg2.call(d3.drag()
    .on("start", event => { lastX2 = event.x; lastY2 = event.y; })
    .on("drag", event => {
        const dx = event.x - lastX2;
        const dy = event.y - lastY2;
        lastX2 = event.x; lastY2 = event.y;
        rotate2[0] += dx * 0.7;
        rotate2[1] -= dy * 0.7;
        rotate2[1] = Math.max(-90, Math.min(90, rotate2[1]));
        projection2.rotate(rotate2);
        svg2.selectAll("path").attr("d", path2);
    })
);

// Responsive resize globe 2
function resizeGlobe2() {
    const containerWidth = svg2.node().parentNode.getBoundingClientRect().width;
    svg2.attr("width", containerWidth).attr("height", containerWidth);
    projection2.translate([containerWidth/2, containerWidth/2]).scale(containerWidth/2 * 0.9);
    path2.projection(projection2);
    svg2.select(".globe-sphere").attr("d", path2);
    svg2.selectAll(".country").attr("d", path2);
}
window.addEventListener("resize", resizeGlobe2);
