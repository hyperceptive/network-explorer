'use strict';

//Constants
var MAX_ARCS = 5,
    MAX_BUBBLES = 5,
    HIDE_LABELS = false,
    INCLUDE_FOCUS_ENTITY_IN_ARCS = true;

var NODE_TYPE_1 = '#1478ba', //blue
    NODE_TYPE_2 = '#7b3890', // '#803b95', //purple
    NODE_TYPE_3 = '#05a9a9', // '#00e6e3'; //green
    NODE_TYPE_4 = '#b48441'; //brighter: #D5944D, darker: #83643A //orange   bubble: #F2AD4F

var ARC_STROKE = '#FFF',
    CONNECTOR_STROKE = '#FFF',
    CHART_LABEL = '#CCC',
    CALLOUT_BACKGROUND = '#CCC';

var ARC_STROKE_OFF_OPACITY = 0.9,
    BUBBLE_FILL_ON_OPACITY = 0.8,
    BUBBLE_FILL_OFF_OPACITY = 0.5,
    CONNECTOR_ARC_ON_OPACITY = 0.9,
    CONNECTOR_ARC_OFF_OPACITY = 0.0,
    CONNECTOR_ON_OPACITY = 0.9,
    CONNECTOR_OFF_OPACITY = 0.22,
    CONNECTOR_STROKE_ON_OPACITY = 0.9,
    CONNECTOR_STROKE_OFF_OPACITY = 0.4;

var TOOLTIP_OPACITY = '0.9';

var DEGREES_90 = 1.57079633;

//Scope variables for data
var titleMap = {},
    focusEntity = {},
    vizName = '',
    vizType = '',
    vizLevelByIndex = [],
    arcs = [],
    arcsById = {},
    arcData = [],
    arcDataById = {},
    bubbleData = [],
    bubblesById = {},
    drilling = false,
    drillDirection = 'forward',
    relationships = [],
    relationshipsByArcId = {},
    relationshipsByBubbleId = {};

//Scope variables for layout
var bubbleLayout,
    chordLayout,
    diagonal,
    arcsSvg,
    bubblesSvg,
    bubbleLabelsSvg,
    connectorsSvg;

//Scope variables for size info
var outerRadius,
    innerRadius,
    bubbleRadius,
    connectorRadius,
    bubblesTranslateX,
    bubblesTranslateY,
    arcsTranslateX,
    arcsTranslateY;


//DOM variables
var title = d3.select(document.getElementById('hcTitle'));
var subtitle = d3.select(document.getElementById('hcSubTitle'));
var chartTitle = d3.select(document.getElementById('hcChartTitle'));
var contentArea = $('#contentAreaTable'); // d3.select(document.getElementById('contentAreaTable'));

var arcTitle = d3.select(document.getElementById('arcTitle'));
var bubbleTitle = d3.select(document.getElementById('bubbleTitle'));


//Helpers
var formatNumber = d3.format(',.0f'),
    formatCurrency = function(d) { return '$' + formatNumber(d); };

function clipString(label) {
  if(label.length > 25) {
    return String(label).substr(0, 25) + '...';
  }
  else {
    return label;
  }
}

function logger(message) {
  //console.log(message);
}



function createElements() {
  var svg = d3.select(document.getElementById('svgChart'));

  svg.selectAll('*').remove();

  connectorsSvg = svg.append('g').attr('class', 'connectors');
  arcsSvg = svg.append('g').attr('class', 'arcs');
  bubblesSvg = svg.append('g').attr('class', 'bubbles');
  bubbleLabelsSvg = svg.append('g').attr('class', 'bubbleLabels');
}


function setupLayout() {
  bubbleLayout = d3.layout.pack()
    .sort('null')
    .padding(1.5);

  chordLayout = d3.layout.chord()
    .padding(0.06);
    //.sortSubgroups(d3.descending)
    //.sortChords(d3.descending);

  diagonal = d3.svg.diagonal.radial();

  //diagonal = d3.svg.diagonal()
  //  .projection(function(d) { return [d.y, d.x / 180 * Math.PI]; });
}


function resize() {
  var chartAreaWidth = 835;

  var chartWidth = 900;
  var chartHeight = 550;

  var maxChartWidth = 600;

  outerRadius = maxChartWidth / 2;
  innerRadius = outerRadius - 120;
  bubbleRadius = innerRadius - 50;
  connectorRadius = innerRadius - 20;
  bubblesTranslateX = (outerRadius - innerRadius) + (innerRadius - bubbleRadius) + 128;
  bubblesTranslateY = (outerRadius - innerRadius) + (innerRadius - bubbleRadius) + 0;
  arcsTranslateX = (outerRadius + 128);
  arcsTranslateY = (outerRadius + 0);

  d3.select(document.getElementById('chartArea'))
    .style('width', chartAreaWidth + 'px');

  chartTitle.style('width', chartWidth - 30 + 'px');

  d3.select(document.getElementById('svgChart'))
    .style('width', chartWidth + 'px')
    .style('height', chartHeight + 'px');

  arcsSvg.attr('transform', 'translate(' + arcsTranslateX + ',' + arcsTranslateY + ')');
  connectorsSvg.attr('transform', 'translate(' + arcsTranslateX + ',' + arcsTranslateY + ')');
  bubblesSvg.attr('transform', 'translate(' + bubblesTranslateX + ',' + bubblesTranslateY + ')');
  bubbleLabelsSvg.attr('transform', 'translate(' + bubblesTranslateX + ',' + bubblesTranslateY + ')');

  bubbleLayout.size([bubbleRadius * 2, bubbleRadius * 2]);
}


function initialize() {
  createElements();
  setupLayout();
  resize();
  buildArcs();
  buildBubbles();
  logger('initialize()');
}


function alphaAsc(a, b) {
  var a1 = a.name;
  var b1 = b.name;

  if(a1 > b1) {
    return 1;
  }
  else if(a1 < b1) {
    return -1;
  }
  return 0;
}


function addNavListRow(table, data, color) {
  var row = $('<tr />');
  table.append(row);
  row.append($('<td style="color:' + color + '">' + data + '</td>'));
}

function onMouseOverNavList(level) {
  $('#navListTable').empty();

  var list = vizLevelByIndex[level - 1].list;

  //List is sorted by popularity descending.
  var tmpList = list.slice();
  tmpList.sort(alphaAsc);

  tmpList.forEach(function(li) {
    addNavListRow($('#navListTable'), li.name, '#AAA');
  });
}

function onMouseOutNavList() {
  $('#navListTable').empty();
}


//Do the same for Group list....
function addGroupListRow(table, level, group, data, color) {
  var row = $('<tr />');
  table.append(row);
  row.append($('<td onMouseOver="onMouseOverGroupList(' + level + ', ' + group + ')" onMouseOut="onMouseOutNavList()" style="color:' + color + '">' + data.name + '</td>'));
}

function onMouseOverGroupList(level, group) {
  $('#navListTable').empty();

  var groups = vizLevelByIndex[level].groups;

  if(groups.hasOwnProperty(group)) {
    //List is sorted by popularity descending.
    var tmpList = groups[group].list.slice();
    tmpList.sort(alphaAsc);

    tmpList.forEach(function(li) {
      addNavListRow($('#navListTable'), li, '#AAA');
    });
  }
}
