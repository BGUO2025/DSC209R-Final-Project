window.addEventListener('DOMContentLoaded', () => {
    const globeEl = document.getElementById('globe');
    if (!globeEl) return;

    const myGlobe = Globe()
        .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
        .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
        (globeEl);

    // Enable interaction
    myGlobe.controls().autoRotate = true;
    myGlobe.controls().autoRotateSpeed = 0.3;
    myGlobe.controls().enableZoom = true;

    // Sample earthquake points
    const sampleQuakes = [
        { lat: 35, lng: 139, size: 0.5 },    // Japan
        { lat: 37, lng: -122, size: 0.4 },   // California
        { lat: -16, lng: -72, size: 0.6 }    // Peru
    ];

    myGlobe
        .pointsData(sampleQuakes)
        .pointColor(() => 'red')
        .pointAltitude(d => d.size)
        .pointRadius(0.5);
});
