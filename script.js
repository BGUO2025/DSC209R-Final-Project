

// ==========================
// DATA LOADING
// ==========================
async function loadCSV(path, sampleSize = null) {
    // Download CSV text through Fetch API (HTTP Request)
    const response = await fetch(path);
    // Extract the content
    const csvText = await response.text();

    // Parse CSV using PapaParse library
    // Keep header, convert to number automatically, skip empty
    const result = Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
    });
    // Extract the content
    let data = result.data;

    // Choose a random subset by input the sample size and shuffle it
    if (sampleSize !== null && sampleSize < data.length) {
        data = data
            .sort(() => Math.random() - 0.5)
            .slice(0, sampleSize);
    }

    return data;
}

// Define another function because of async/await structure, annoying
async function loadData(sample_Size = null) {
    const sample = await loadCSV("data.csv", sample_Size);
    console.log("Random 100:", sample);
}
loadData()


// ==========================
// DOT FOR PAGES
// ==========================
document.addEventListener("DOMContentLoaded", () => {
    const dots = document.querySelectorAll(".nav-dot");

    const updateActiveDot = () => {
        let closestDot = null;
        let closestDistance = Infinity;

        dots.forEach(dot => {
            const targetId = dot.getAttribute("data-target");
            const targetEl = document.getElementById(targetId);
            if (!targetEl) return;

            // distance from top of viewport to top of section
            const rect = targetEl.getBoundingClientRect();
            const distance = Math.abs(rect.top);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestDot = dot;
            }
        });

        if (closestDot) {
            dots.forEach(d => d.classList.remove("active"));
            closestDot.classList.add("active");
        }
    };

    // Scroll to section on dot click
    dots.forEach(dot => {
        const targetId = dot.getAttribute("data-target");
        const targetEl = document.getElementById(targetId);

        dot.addEventListener("click", () => {
            if (targetEl) {
                targetEl.scrollIntoView({ behavior: "smooth" });
                // highlight immediately
                dots.forEach(d => d.classList.remove("active"));
                dot.classList.add("active");
            }
        });
    });

    // Update on scroll and after scroll ends (scroll-snap)
    window.addEventListener("scroll", updateActiveDot);
    window.addEventListener("resize", updateActiveDot);

    // Optional: observe scroll snapping end using IntersectionObserver
    const observer = new IntersectionObserver(() => {
        updateActiveDot();
    }, { threshold: 0.5 });

    document.querySelectorAll("section, .hero").forEach(sec => observer.observe(sec));

    // initial update
    updateActiveDot();
});

// ==========================
// TOOLTIP
// ==========================
const tooltip = d3.select("#globe-tooltip");

// ==========================
// PAGE 2: EARTH LAYERS PLOT
// ==========================
// Hotspot behavior: show layer info on hover/focus/click
document.addEventListener("DOMContentLoaded", () => {
  const hotspots = document.querySelectorAll(".hotspot");
  const infoBox = document.getElementById("earth-layer-info");
  const defaultMsg = "Hover over the middle of each layer to learn more."
;

  // safety: if no hotspots found, exit early
  if (!infoBox || hotspots.length === 0) {
    // console.warn("No hotspots or info box found.");
    return;
  }

  hotspots.forEach(h => {
    const name = h.dataset.name || "Layer";
    const desc = h.dataset.desc || "";

    // Hover & focus show details
    h.addEventListener("mouseover", () => {
      infoBox.innerHTML = `<strong>${name}</strong><br>${desc}`;
    });
    h.addEventListener("focus", () => {
      infoBox.innerHTML = `<strong>${name}</strong><br>${desc}`;
    });

    // mouseout & blur reset
    h.addEventListener("mouseout", () => {
      infoBox.textContent = defaultMsg;
    });
    h.addEventListener("blur", () => {
      infoBox.textContent = defaultMsg;
    });

    // click for touch: show and persist briefly so users can read
    let clickTimer;
    h.addEventListener("click", (e) => {
      e.preventDefault();
      clearTimeout(clickTimer);
      infoBox.innerHTML = `<strong>${name}</strong><br>${desc}`;
      // persist for 3s then revert
      clickTimer = setTimeout(() => {
        infoBox.textContent = defaultMsg;
      }, 3000);
    });
  });
});




// ==========================
// PAGE 3: GLOBE 1
// ==========================
const svg1 = d3.select("#globe-svg");
const path1 = d3.geoPath();
const quakeHighlight = "#b30000";   // dark red

const projection1 = d3.geoOrthographic().clipAngle(90);
let rotate1 = [0, -20];
let lastX1, lastY1;
let earthquakesGroup;

svg1.append("path")
  .datum({ type: "Sphere" })
  .attr("class", "globe-sphere")
  .attr("fill", "#000")
  .attr("stroke", "#fff")
  .attr("stroke-width", 0.5);

svg1.append("defs")
    .append("clipPath")
    .attr("id", "front-hemisphere")
    .append("path")
    .attr("class", "globe-clip");

const countriesGroup1 = svg1.append("g").attr("class", "countries");

d3.json("https://unpkg.com/world-atlas@2/countries-110m.json").then(worldData => {
  const countries = topojson.feature(worldData, worldData.objects.countries).features;

  countriesGroup1.selectAll(".country")
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
               .style("display","block")
               .style("left", (event.pageX + 10) + "px")
               .style("top",  (event.pageY + 10) + "px");
      })
      .on("mousemove", event => {
        tooltip.style("left", (event.pageX + 10) + "px")
               .style("top",  (event.pageY + 10) + "px");
      })
      .on("mouseout", (event) => {
        d3.select(event.currentTarget).attr("fill", "#000");
        tooltip.style("display","none");
      });

    resizeGlobe1();
    plotEarthquakesPoints();
});

svg1.call(d3.drag()
    .on("start", event => { lastX1 = event.x; lastY1 = event.y; })
    .on("drag", event => {
        const dx = event.x - lastX1;
        const dy = event.y - lastY1;
        lastX1 = event.x; lastY1 = event.y;
        rotate1[0] += dx * 0.7;
        rotate1[1] -= dy * 0.7;
        rotate1[1] = Math.max(-90, Math.min(90, rotate1[1]));
        projection1.rotate(rotate1);

        svg1.selectAll("path").attr("d", path1);
        updateEarthquakes();
        updateClipPath();
    })
);

window.addEventListener("resize", resizeGlobe1);

async function plotEarthquakesPoints(sample_Size = null) {
    const earthquakeData = (await loadCSV("data.csv", sample_Size))
        .filter(d => 
            d.mag != null && !isNaN(d.mag) &&
            d.latitude != null && !isNaN(d.latitude) &&
            d.longitude != null && !isNaN(d.longitude)
        );

    earthquakesGroup = svg1.append("g")
        .attr("class", "earthquakes")
        .attr("clip-path", "url(#front-hemisphere)");

    earthquakesGroup.selectAll("circle")
        .data(earthquakeData)
        .enter()
        .append("circle")
        .attr("cx", d => projection1([d.longitude, d.latitude])[0])
        .attr("cy", d => projection1([d.longitude, d.latitude])[1])
        .attr("r", d => Math.sqrt(Math.abs(d.mag)) * 4)
        .attr("fill", "red")
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.3)
        .attr("opacity", d => 
        isPointVisible(d.longitude, d.latitude, rotate1) ? 0.8 : 0)
        .on("mouseover", function(event, d) {
            // enlarge dot
            d3.select(this)
            .transition()
            .duration(150)
            .attr("fill", "#4d1515ff")
            .attr("r", Math.sqrt(d.mag) * 8);  

            let location = d.place;
            let distance = "";

            if (d.place.includes(",")) {
                const parts = d.place.split(",");
                distance = parts[0].trim();
                location = parts[1].trim();
            }

            tooltip.html(`
            <strong>${location}</strong><br>
            ${distance ? `* Distance: ${distance}<br>` : ""}
            * Mag: ${d.mag != null ? d.mag : "Unknown"}
            `)
            .style("display", "block")
            .style("left", (event.pageX + 10) + "px")
            .style("top",  (event.pageY + 10)  + "px");
        })
        .on("mousemove", event => {
            tooltip.style("left", (event.pageX + 10) + "px")
           .style("top",  (event.pageY + 10)  + "px");
        })
        .on("mouseout", function(event, d) {
            tooltip.style("display","none");

        // shrink back to original radius
        d3.select(this)
            .transition()
            .duration(150)
            .attr("fill", "red")
            .attr("r", Math.sqrt(d.mag) * 4);
    });
}

// Function to resize global to fit current container
function resizeGlobe1() {
    const containerWidth = svg1.node().parentNode.getBoundingClientRect().width;
    svg1.attr("width", containerWidth).attr("height", containerWidth);
    projection1.translate([containerWidth / 2, containerWidth / 2])
               .scale(containerWidth / 2 * 0.9);
    path1.projection(projection1);
    svg1.select(".globe-sphere").attr("d", path1);
    svg1.selectAll(".country").attr("d", path1);

    updateEarthquakes();
    updateClipPath(); 
}

// Function to update earthquakes on rotation or resize
function updateEarthquakes() {
    svg1.selectAll(".earthquakes circle")
        .attr("cx", d => projection1([d.longitude, d.latitude])[0])
        .attr("cy", d => projection1([d.longitude, d.latitude])[1])
        .attr("opacity", d =>
            isPointVisible(d.longitude, d.latitude, rotate1) ? 0.8 : 0
        );
}

// Function to show data in front sphere
function updateClipPath() {
    svg1.select(".globe-clip")
        .attr("d", path1({ type: "Sphere" }));
}

function isPointVisible(lon, lat, rotate) {
    const λ = lon * Math.PI/180;
    const φ = lat * Math.PI/180;

    const λ0 = -rotate[0] * Math.PI/180; // invert rotation
    const φ0 = -rotate[1] * Math.PI/180;

    const cosc = Math.sin(φ0)*Math.sin(φ) +
                 Math.cos(φ0)*Math.cos(φ)*Math.cos(λ - λ0);

    return cosc > 0;  // visible hemisphere
}

// ==========================
// PAGE 4: GLOBE 2 
// ==========================
const svg2 = d3.select("#globe-svg-2");
const path2 = d3.geoPath();
const projection2 = d3.geoOrthographic().clipAngle(90);
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

let selectedCountry = null;
let connectorPath = null;

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
        if (d !== selectedCountry) d3.select(event.currentTarget).attr("fill", "#2156e9ff");
        tooltip.text(d.properties.name)
               .style("display","block")
               .style("left", (event.pageX + 10) + "px")
               .style("top",  (event.pageY + 10) + "px");
      })
      .on("mousemove", event => {
        tooltip.style("left", (event.pageX + 10) + "px")
               .style("top",  (event.pageY + 10) + "px");
      })
      .on("mouseout", (event, d) => {
        if (d !== selectedCountry) d3.select(event.currentTarget).attr("fill", "#000");
        tooltip.style("display","none");
      })
      .on("click", (event, d) => {
        if (selectedCountry) {
          countriesGroup2.selectAll(".country")
            .filter(c => c.properties.name === selectedCountry.properties.name)
            .attr("fill", "#000");
        }
        d3.select(event.currentTarget).attr("fill", "#ffb347");
        selectedCountry = d;

        d3.select("#country-name").text(d.properties.name);
        d3.select("#country-details").text(`You clicked on ${d.properties.name}.`);

        // draw country map
        countryMapSvg.selectAll("*").remove();
        const cw = countryMapSvg.node().getBoundingClientRect().width;
        const ch = countryMapSvg.node().getBoundingClientRect().height;
        const countryProjection = d3.geoMercator().fitSize([cw, ch], d);
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

function resizeGlobe2(){
  const cw = svg2.node().parentNode.getBoundingClientRect().width;
  svg2.attr("width", cw).attr("height", cw);
  projection2.translate([cw/2, cw/2]).scale(cw/2 * 0.9);
  path2.projection(projection2);
  svg2.select(".globe-sphere").attr("d", path2);
  svg2.selectAll(".country").attr("d", path2);

}
window.addEventListener("resize", resizeGlobe2);
window.addEventListener("scroll", () => {
  if (selectedCountry) drawConnector();
});


