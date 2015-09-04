'use strict';

var graph,
    height,  //TODO: fish: Overall or Chart???
    width;


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



//sorting....
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


function weightDesc(a, b) {
  var a1 = a.weight;
  var b1 = b.weight;

  if(a1 < b1) {
    return 1;
  }
  else if(a1 > b1) {
    return -1;
  }
  return 0;
}


function graphWeightDesc(a, b) {
  var a1 = graph.getAllEdgesOf(a.name).length;
  var b1 = graph.getAllEdgesOf(b.name).length;

  if(a1 < b1) {
    return 1;
  }
  else if(a1 > b1) {
    return -1;
  }
  return 0;
}
