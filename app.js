'use strict';

import * as d3 from 'https://cdn.skypack.dev/d3@7';

const eduDataUrl = 'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json'
const mapDataUrl = 'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json';

const getEduData = async () => {

  return d3.json(eduDataUrl);
}

const getMapData = async () => {

  return d3.json(mapDataUrl);
}

const edu = await getEduData();
const mapData = await getMapData();

const counties = topojson.feature(mapData, mapData.objects.counties).features;
const countyMap = new Map(edu.map((e) => [e.fips, e]));

const width = 975;
const height = 610;
const legendWidth = 375;
const legendHeight = 10;

const domain = d3.extent(edu, (d) => d.bachelorsOrHigher);
const range = d3.schemeBuGn[9];
const getColor = d3.scaleQuantize(domain, range);

const legendSvg = d3.select('#legend-container')
  .append("svg")
  .attr('id', 'legend')
  .attr("width", legendWidth)
  .attr("height", legendHeight)
  .attr("viewBox", [0, 0, legendWidth, legendHeight])
  .style("overflow", "visible")
  .style("display", "block");

const legendStopSize = Math.ceil((domain[1] - domain[0]) / 9);
const legendStops = [];
for (let i = 0; i < 10; i += 1) {
  legendStops.push(Math.floor(domain[0]) + (i * legendStopSize));
}

const legendScale = d3.scaleLinear(d3.extent(legendStops), [0, legendWidth]);

const legendKeys = legendStops.slice(0, legendStops.length - 1);

legendSvg.append('g')
  .selectAll('rect')
  .data(legendKeys)
  .join('rect')
  .attr('width', legendWidth / 9)
  .attr('height', legendHeight)
  .attr('transform', (d, i) => `translate(${i * (legendWidth / 9)}, 0)`)
  .style('fill', getColor);

const legendAxis = d3.axisBottom(legendScale)
  .tickValues(legendStops)
  .tickFormat((d) => `${d}%`)
  .tickSize('15');

legendSvg.append('g')
  .call(legendAxis)
  .call((g) => g.select('.domain').remove());

const getToolTipHtml = (d) => {
  const {
    area_name,
    bachelorsOrHigher,
    fips,
    state,
  } = countyMap.get(d.id);

  return `<p>${area_name}, ${state}: ${bachelorsOrHigher}%</p>`;
}

const tooltip = d3.select('#map-container')
  .append('div')
  .attr('id', 'tooltip')
  .style('position', 'absolute')
  .style('background-color', 'black')
  .style('opacity', '0.85')
  .style('color', 'white')
  .style('visibility', 'hidden')
  .style('font-family', 'arial')
  .style('border-radius', '5px')
  .style('padding', '0 15px 0 15px');

const getTooltipWidth = () => {
  const el = document.getElementById('tooltip');

  return el.offsetWidth;
}

const onMouseOver = (e, d) => {
  tooltip.attr('data-education', countyMap.get(d.id).bachelorsOrHigher)
    .style('visibility', 'visible')
    .html(getToolTipHtml(d));
}

const onMouseLeave = (e, d) => {
  tooltip.style('visibility', 'hidden');
}

const onMouseMove = (e, d) => {
  tooltip
    .style('left', `${e.pageX - (getTooltipWidth() / 2)}px`)
    .style('top', `${e.pageY - 65}px`)
}

const svg = d3.select('#map-container')
  .append('svg')
  .attr('width', width)
  .attr('height', height)
  .attr('viewBox', [0, 0, width, height]);

const path = d3.geoPath();

svg.append('g')
  .selectAll('path')
  .data(counties)
  .join('path')
  .attr('class', 'county')
  .attr('data-fips', (d) => countyMap.get(d.id).fips)
  .attr('data-education', (d) => countyMap.get(d.id).bachelorsOrHigher)
  .attr('data-state', (d) => countyMap.get(d.id).state)
  .attr('d', path)
  .attr('stroke', 'black')
  .attr('fill', (d) => getColor(countyMap.get(d.id).bachelorsOrHigher))
  .on('mousemove', onMouseMove)
  .on('mouseover', onMouseOver)
  .on('mouseleave', onMouseLeave)
  .style('stroke-width', '0.5');

svg.append('path')
  .attr('pointer-events', 'none')
  .attr('d', path(topojson.mesh(mapData, mapData.objects.states, (a, b) => (a !== b))))
  .attr('fill', 'none');
