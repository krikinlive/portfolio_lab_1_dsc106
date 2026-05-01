import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');

const projectsTitle = document.querySelector('.projects-title');
if (projectsTitle) {
    projectsTitle.textContent = `${projects.length} Projects`;
}

const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');

// Pie Chart

let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let colors = d3.scaleOrdinal(d3.schemeTableau10);
let selectedIndex = -1;

function renderPieChart(projectsGiven) {
    // Roll up data by year
    let newRolledData = d3.rollups(
        projectsGiven,
        (v) => v.length,
        (d) => d.year,
    );

    let newData = newRolledData.map(([year, count]) => {
        return { value: count, label: year };
    });

    // Generate pie slices
    let newSliceGenerator = d3.pie().value((d) => d.value);
    let newArcData = newSliceGenerator(newData);
    let newArcs = newArcData.map((d) => arcGenerator(d));

    // Clear legends and paths
    let newSVG = d3.select('#projects-pie-plot');
    newSVG.selectAll('path').remove();

    let legend = d3.select('.legend');
    legend.selectAll('li').remove();

    // Draw pie slices
    newArcs.forEach((arc, i) => {
        newSVG
            .append('path')
            .attr('d', arc)
            .attr('fill', colors(i))
            .on('click', () => {
                selectedIndex = selectedIndex === i ? -1 : i;

                newSVG
                    .selectAll('path')
                    .attr('class', (_, idx) => (
                        idx === selectedIndex ? 'selected' : ''
                    ));

                legend
                    .selectAll('li')
                    .attr('class', (_, idx) => (
                        idx === selectedIndex ? 'legend-item selected' : 'legend-item'
                    ));

                if (selectedIndex === -1) {
                    renderProjects(projectsGiven, projectsContainer, 'h2');
                } else {
                    let selectedYear = newData[selectedIndex].label;
                    let filteredByYear = projectsGiven.filter((p) => p.year === selectedYear);
                    renderProjects(filteredByYear, projectsContainer, 'h2');
                }
            });
    });

    // Draw legend
    newData.forEach((d, idx) => {
        legend
            .append('li')
            .attr('style', `--color:${colors(idx)}`)
            .attr('class', 'legend-item')
            .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
    });
}

// Render
renderPieChart(projects);

// Search

let query = '';
let searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('input', (event) => {
    query = event.target.value;
    let filteredProjects = projects.filter((project) => {
        let values = Object.values(project).join('\n').toLowerCase();
        return values.includes(query.toLowerCase());
    });

    renderProjects(filteredProjects, projectsContainer, 'h2');
    renderPieChart(filteredProjects);
});