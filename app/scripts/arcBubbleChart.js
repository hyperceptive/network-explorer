'use strict';


function getGroupColor(group) {
  var color = '#AAA';

  switch(parseInt(group)) {
    case 1:
      color = NODE_TYPE_1;
      break;
    case 2:
      color = NODE_TYPE_2;
      break;
    case 3:
      color = NODE_TYPE_3;
      break;
    case 4:
      color = NODE_TYPE_4;
      break;
  }

  return color;
}


/**
 * Setup the labels
 *
 */
function updateLabels() {
  console.log('updateLables() ???');

  /* fish:
  arcTitle.text(vizLevelByIndex[0].name);
  bubbleTitle.text(vizLevelByIndex[1].name);

  //Display groups
  $('#arcListTable').empty();

  for(var key in vizLevelByIndex[0].groups) {
    if(vizLevelByIndex[0].groups.hasOwnProperty(key)) {
      addGroupListRow($('#arcListTable'), 0, key, vizLevelByIndex[0].groups[key], getGroupColor(key));
    }
  }

  $('#bubbleListTable').empty();

  for(key in vizLevelByIndex[1].groups) {
    if(vizLevelByIndex[1].groups.hasOwnProperty(key)) {
      addGroupListRow($('#bubbleListTable'), 1, key, vizLevelByIndex[1].groups[key], getGroupColor(key));
    }
  }
  */

}

/**
 * Calculate the sizes of the arcs around the outside of the circle.
 *
 * Also setup arcsById
 *
 */
function buildArcs() {
  arcs = [];
  arcsById = {};

  var matrix = [];
  var idByIndex = [];
  var nameByIndex = [];
  var indexByName = [];

  var n = 0;

  //Create unique indexes for the arcs
  arcData.forEach(function(d) {
    if(!(d.name in indexByName)) {
      idByIndex[n] = d.id;
      nameByIndex[n] = d.name;
      indexByName[d.name] = n++;
    }
  });

  //Build matrix for the Chord layout
  arcData.forEach(function(d) {
    var source = indexByName[d.name],
        row = matrix[source];

    if(!row) {
      row = matrix[source] = [];
      for(var j = -1; ++j < n; ) {
        row[j] = 0;
      }
    }

    row[indexByName[d.name]] = Number(d.value);
  });

  //Set the data for the chord layout
  chordLayout.matrix(matrix);

  arcs = chordLayout.chords();

  arcs.forEach(function (d, i) {
    d.id = idByIndex[i];
    d.label = nameByIndex[i];
    d.angle = (d.source.startAngle + d.source.endAngle) / 2;
    var o = {};
    o.startAngle = d.source.startAngle;
    o.endAngle = d.source.endAngle;
    o.index = d.source.index;
    o.value = d.source.value;
    o.currentAngle = d.source.startAngle;
    o.currentConnectorAngle = d.source.startAngle;
    o.source = d.source;
    o.relatedConnectors = [];
    arcsById[d.id] = o;
    i++;
  });

  for(var key in arcsById) {
    if(arcsById.hasOwnProperty(key) && relationshipsByArcId.hasOwnProperty(key)) {
      arcsById[key].relatedConnectors = relationshipsByArcId[key];
    }
  }

  logger('buildArcs()');
}


function wrap(textArr, width) {
  textArr.each(function() {
    var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 16, //px
        angle = parseFloat(text.attr('dummyAngle')),
        dx = parseFloat(text.attr('dx')),
        dy = parseFloat(text.attr('dy')),
        tspan = text.text(null)
          .append('tspan')
          .attr('x', 0)
          .attr('dy', dy + 'px');

    //If label is on right, go further right.
    if(angle < 180) {
      dx += 3;
    }
    else {
      dx -= 2;
    }

    while(word = words.pop()) { //eslint-disable-line
      line.push(word);
      tspan.text(line.join(' '));
      if(tspan.node().getComputedTextLength() > width) {
        lineNumber++;
        var newDy = lineNumber * lineHeight + dy;
        if(newDy === 35) { //fish: Not sure what's going on with this calculation.
          newDy = 20;
        }

        //console.log('lineNumber: ' + lineNumber + ', lineHeight: ' + lineHeight + ', dy: ' + dy + ', newDy: ' + newDy);

        line.pop();
        tspan.text(line.join(' '));
        line = [word];
        tspan = text.append('tspan')
                  .attr('x', dx + 'px')
                  .attr('dy', newDy + 'px').text(word);
      }
    }
  });
}

/**
 * Setup and draw the arcs
 *
 * Enter-Update-Exit Pattern
 *
 */
function updateArcs() {
  var arcGroup = arcsSvg.selectAll('g.arcs')
    .data(arcs, function (d) {
      return d.id + '_' + d.angle;
    });

  var enter = arcGroup.enter().append('g').attr('class', 'arcs');

  //arc label
  if(!HIDE_LABELS) {
    enter.append('text')
      .attr('class', 'arc')
      .attr('dx', function (d, i) {
        var angle = d.angle * 180 / Math.PI;

        //If label is on right, go right.
        if(angle < 180) {
          return '10px';
        }
        else {
          return '-10px';
        }
      })
      .attr('dy', '3px')
      .attr('dummyAngle', function (d, i) {
        var angle = d.angle * 180 / Math.PI;
        return angle;
      })
      .style('fill', function(d) {
        return '#231f20';
        //fish: return getGroupColor(arcDataById[d.id].group);
      })
      .on('mouseover', function (d) { onMouseOver(d, 'arc'); })
      .on('mouseout', function (d) { onMouseOut(d, 'arc'); })
      .on('click', function (d) { onMouseClick(d, 'arcText'); });
  }

  //arc outline
  enter.append('path')
    .attr('class', 'arcOutline')
    .style('fill-opacity', 0)
    .style('stroke', ARC_STROKE)
    .style('stroke-width', 1)
    .style('stroke-opacity', ARC_STROKE_OFF_OPACITY)
    .style('stroke-dasharray', function(d) {
      return ('5, 5');
    })
    .attr('d', function (d, i) {
      var arc = d3.svg.arc(d, i).innerRadius(innerRadius - 20).outerRadius(innerRadius);
      return arc(d.source, i);
    });

  if(!HIDE_LABELS) {
    enter.append('circle')
      .attr('class', 'arcLabelDot')
      .style('fill', function(d) {
        return getGroupColor(arcDataById[d.id].group);
      })
      .style('fill-opacity', 0.9)
      .attr('r', function(d) {
        return 2;
      })
      .attr('transform', function(d) {
        var x = ((innerRadius + 17) * Math.cos(d.angle - DEGREES_90));
        var y = ((innerRadius + 17) * Math.sin(d.angle - DEGREES_90));
        return 'translate(' + x + ',' + y + ')';
      });
  }

  //Apply to new and existing.
  arcGroup.selectAll('text')
    //level labels
    .attr('text-anchor', function(d) { return d.angle > Math.PI ? 'end' : null; })
    .attr('transform', function(d) {
      var x = ((innerRadius + 20) * Math.cos(d.angle - DEGREES_90));
      var y = ((innerRadius + 20) * Math.sin(d.angle - DEGREES_90));
      return 'translate(' + x + ',' + y + ')';
    })
    /* radial labels
    .attr('transform', function(d) {
      return 'rotate(' + (d.angle * 180 / Math.PI - 90) + ')'
        + 'translate(' + (innerRadius + 6) + ')'
        + (d.angle > Math.PI ? 'rotate(180)' : '');
    })
    */
    .text(function(d) { return d.label; })
    .call(wrap, 200)
    .attr('id', function (d) { return 't_' + d.id; });

  arcGroup.exit().remove();

  logger('updateArcs()');
}



/**
 * Get ready to draw the bubbles.
 *
 */
function buildBubbles() {
  var bubbles = [],
      root = {};

  //TODO: To pack bubbles into multiple groups, bubbleData should be an array of groups (with children).

  root.children = bubbleData;
  bubbles = bubbleLayout.nodes(root);

  bubbles.forEach(function (d) {
    if(d.depth === 1) {
      d.relatedConnectors = relationshipsByBubbleId[d.id];
    }
  });

  logger('buildBubbles()');
}


/**
 * Setup and draw the Bubbles (Circles) in the middle
 *
 * Enter-Update-Exit Pattern
 *
 */
function updateBubbles() {
  //1: update the data
  var bubbleGroup = bubblesSvg.selectAll('g.bubble')
    .data(bubbleData, function (d, i) {
      //if any of these values change, consider it a key change.
      return d.id + '_' + d.value + '_' + d.r;
    });

  //2: Operate only on existing elements - currently nothing.

  //3: Operate only on new elements.
  var enter = bubbleGroup.enter().append('g').attr('class', 'bubble');

  enter.append('circle')
    .attr('class', 'bubble')
    .attr('id', function(d) { return 'b_' + d.id; })
    .style('fill', function(d) {
      return getGroupColor(d.group);
    })
    .style('fill-opacity', BUBBLE_FILL_OFF_OPACITY)
    .on('mouseover', function (d) { onMouseOver(d, 'bubble'); })
    .on('mouseout', function (d) { onMouseOut(d, 'bubble'); })
    .on('click', function (d) { onMouseClick(d, 'bubble'); })
    .attr('r', function (d) { return 0; })
    .transition()
    .duration(800)
    .ease('elastic')  //cubic, elastic, bounce, linear
    .attr('r', function (d) { return d.r - 1; });

  enter.append('circle')
    .attr('class', 'bubbleCenter')
    .style('fill', function(d) { return '#FFFFFF'; })
    .style('fill-opacity', 1)
    .attr('r', function(d) {
      if(d.r > 75) {
        return 3;
      }
      return 2;
    });

  //For the hover highlight
  var g = enter.append('g')
    .attr('id', function(d) { return 'bh_' + d.id; })
    .style('opacity', 0);

  g.append('circle')
    .attr('class', 'bubbleCenterHighlight')
    .style('fill', function(d) { return '#FFF'; })
    .style('fill-opacity', 1);

  //4: Operate on new and existing elements
  bubbleGroup.attr('transform', function(d) {
      return 'translate(' + d.x + ',' + d.y + ')';
    });

  bubbleGroup.selectAll('.bubbleCenterHighlight')
    .attr('r', function(d) { return 4; });

  //5: complete the enter-update-exit pattern
  bubbleGroup.exit().remove().transition().duration(500).style('opacity', 0);

  logger('updateBubbles()');
}


/**
 * Setup and draw the Bubble Labels and Callouts
 *
 * Enter-Update-Exit Pattern
 *
 */
function updateBubbleLabels() {
  //1: update the data
  var bubbleLabelsGroup = bubbleLabelsSvg.selectAll('g.bubbleLabels')
    .data(bubbleData, function (d, i) {
      //if any of these values change, consider it a key change.
      return d.id + '_' + d.value + '_' + d.r;
    });

  //2: Operate only on existing elements - currently nothing.

  //3: Operate only on new elements.
  var enter = bubbleLabelsGroup.enter().append('g').attr('class', 'bubbleLabels');

  //Label in Callout
  var callout = enter.append('g');

  if(!HIDE_LABELS) {
    enter.append('text')
      .attr('id', function(d) { return 't_' + d.id.toString().replace(/&/g, ''); })
      .text(function(d) { return d.name; })
      .style('font-size', function(d) {
        //console.log('Font Size: ' + Math.min(1, Math.max(0.5, d.r * 2 / bubbleRadius)) * 18 + 'px'); //fish
        //return Math.min(1, Math.max(0.5, d.r * 2 / bubbleRadius)) * 18 + 'px';
        return '12px';
      })
      .attr('dy', function (d, i) {
        //Change yOffset based on height.
        var returnVal = '-3px'; //small text
        var height = this.getBBox().height;

        if(height >= 22) {
          returnVal = '-5px'; //big text
        }
        else if(height > 15) {
          returnVal = '-4px';
        }

        return returnVal;
      })
      .attr('dx', function (d, i) {
        d.textLength = this.getComputedTextLength(); //save fer later
        d.textHeight = this.getBBox().height;

        //If center x point is greater than middle, go right.
        if(d.x > bubbleRadius) {
          return '35px';
        }
        else {
          var xOffset = d.textLength + 35;
          return '-' + xOffset + 'px';
        }
      });
  }

  callout.append('path')
    .attr('id', function(d) { return 'p_' + d.id.toString().replace(/&/g, ''); })
    .style('fill', CALLOUT_BACKGROUND)
    .style('stroke', CALLOUT_BACKGROUND)
    .style('stroke-width', 1.5)
    .attr('class', 'bubbleLabel')
    .attr('d', function (d, i) {
      //If center x point is greater than middle, go right.
      var hLength = d.textLength + 40;
      var CALLOUT_HEIGHT = 25 * (d.textHeight / 22);

      if(d.x > bubbleRadius) {
        return 'M 0,0 L ' + hLength + ',0 L ' + hLength + ',-' + CALLOUT_HEIGHT + ' L 35,-' + CALLOUT_HEIGHT + ' L 15,0 Z';
      }
      else {
        return 'M 0,0 L -' + hLength + ',0 L -' + hLength + ',-' + CALLOUT_HEIGHT + ' L -35,-' + CALLOUT_HEIGHT + ' L -15,0 Z';
      }
    });

  //4: Operate on new and existing elements
  bubbleLabelsGroup.attr('transform', function(d) {
      return 'translate(' + d.x + ',' + d.y + ')';
    });

  //5: complete the enter-update-exit pattern
  bubbleLabelsGroup.exit().remove().transition().duration(500).style('opacity', 0);

  logger('updateBubbleLabels()');
}


function drawArc(d, i) {
  var newArc = {};
  var relatedArc = arcsById[d.arcId];
  var relatedArcData = arcDataById[d.arcId];

  //Start and end angle are based on the data.
  newArc.startAngle = relatedArc.currentAngle;
  relatedArc.currentAngle = relatedArc.currentAngle + (Number(1) / relatedArcData.value) * (relatedArc.endAngle - relatedArc.startAngle);
  newArc.endAngle = relatedArc.currentAngle;

  //Inner and outer radius are fixed.
  var arc = d3.svg.arc(d, i).innerRadius(connectorRadius).outerRadius(innerRadius);

  return arc(newArc);
}


/**
 * Setup and draw the Connectors between the Arcs and the Bubbles.
 *
 * Currently, Connectors are removed when data is updated, so we aren't (yet) using Enter-Update-Exit Pattern.
 *
 */
function updateConnectors(connectors) {

  function createConnectors(d) {
    var target = {}; //target not used anymore.
    var source = {};
    var connector = {};
    var connector2 = {};
    var source2 = {};

    var relatedArc = arcsById[d.arcId];
    var relatedArcData = arcDataById[d.arcId];
    var relatedBubble = bubblesById[d.bubbleId];
    var r = connectorRadius;
    var currX = (r * Math.cos(relatedArc.currentConnectorAngle - DEGREES_90));
    var currY = (r * Math.sin(relatedArc.currentConnectorAngle - DEGREES_90));

    var a = relatedArc.currentConnectorAngle - DEGREES_90;
    relatedArc.currentConnectorAngle = relatedArc.currentConnectorAngle + (Number(1) / relatedArcData.value) * (relatedArc.endAngle - relatedArc.startAngle);
    var a1 = relatedArc.currentConnectorAngle - DEGREES_90;

    source.x = (r * Math.cos(a));
    source.y = (r * Math.sin(a));
    target.x = relatedBubble.x - (arcsTranslateX - bubblesTranslateX);
    target.y = relatedBubble.y - (arcsTranslateY - bubblesTranslateY);
    source2.x = (r * Math.cos(a1));
    source2.y = (r * Math.sin(a1));
    connector.source = source;
    connector.target = target;
    connector2.source = target;
    connector2.target = source2;

    return [connector, connector2];
  }

  //1: update the data
  var connectorGroup = connectorsSvg.selectAll('g.connectors')
    .data(connectors, function (d, i) {
      return d.id;
    });

  //2: Operate only on existing elements -- Currently nothing.

  //3: Operate only on new elements.
  var enter = connectorGroup.enter().append('g').attr('class', 'connectors');

  // Arcs
  enter.append('g')
    .append('path')
    .attr('class', 'arc')
    .attr('id', function(d) { return 'a_' + d.id; })
    .style('fill', function(d) {
      return getGroupColor(arcDataById[d.arcId].group);
    })
    .style('fill-opacity', CONNECTOR_ARC_OFF_OPACITY)
    .attr('d', function (d, i) {
      return drawArc(d, i);
    })
    .on('mouseover', function (d) { onMouseOver(d, 'connector'); })
    .on('mouseout', function (d) { onMouseOut(d, 'connector'); })
    .on('click', function (d) { onMouseClick(d, 'arc'); });

  // Connectors between Arcs and Bubbles
  enter.append('path')
    .attr('class', 'connector')
    .attr('id', function (d) { return 'c_' + d.id; })
    .style('stroke', CONNECTOR_STROKE)
    .style('stroke-width', 1)
    .style('stroke-opacity', CONNECTOR_STROKE_OFF_OPACITY)
    .style('fill', function(d) {
      return getGroupColor(arcDataById[d.arcId].group);
    })
    .style('fill-opacity', CONNECTOR_OFF_OPACITY)
    .attr('d', function (d, i) {
      d.connectors = createConnectors(d);
      var diag = diagonal(d.connectors[0], i);
      diag += 'L' + String(diagonal(d.connectors[1], i)).substr(1);
      diag += 'A' + (connectorRadius) + ',' + (connectorRadius) + ' 0 0, 0 ' + d.connectors[0].source.x + ',' + d.connectors[0].source.y;
      return diag;
    })
    .on('mouseover', function (d) { onMouseOver(d, 'connector'); })
    .on('mouseout', function (d) { onMouseOut(d, 'connector'); });

  //5: Complete the enter-update-exit pattern
  connectorGroup.exit().remove();

  logger('updateConnectors()');
}



//**************************
// Event Handling
//**************************

function onMouseOver(d, type) {
  if(drilling) { return; }

  if(autoSelected) {
    onMouseOut(autoSelected, 'bubble');
    autoSelected = null;
  }

  var arcHideList = [];
  var bubbleHideList = [];

  //highlight this bubble and all arcs and connectors coming to this bubble.
  if(type === 'bubble') {
    if(d.depth < 1) { return; }

    //Hide any Arc labels not connected to this bubble.
    for(var key in arcsById) {
      if(arcsById.hasOwnProperty(key)) {
        var found = false;

        for(var i = 0; i < d.relatedConnectors.length; i++) {
          if(key === d.relatedConnectors[i].arcId.toString()) {
            found = true;
            break;
          }
        }

        if(!found) {
          arcHideList.push(key);
        }
      }
    }

    //Hide all bubble labels, except this one.
    for(var key1 in bubblesById) {
      if(bubblesById.hasOwnProperty(key1)) {
        if(key1 !== d.id.toString()) {
          bubbleHideList.push(key1);
        }
      }
    }

    highlightConnectors(d, true);
  }
  //highlight this connectors and the corresponding arc and bubble.
  else if(type === 'connector') {
    //Hide all Arc labels, except the one tied to this connector.
    for(var key2 in arcsById) {
      if(arcsById.hasOwnProperty(key2)) {
        if(key2 !== d.arcId.toString()) {
          arcHideList.push(key2);
        }
      }
    }

    //Hide all bubble labels, except this one.
    for(var key3 in bubblesById) {
      if(bubblesById.hasOwnProperty(key3)) {
        if(key3 !== d.bubbleId.toString()) {
          bubbleHideList.push(key3);
        }
      }
    }

    highlightConnector(d, true);
  }
  //highlight all bubbles and connectors coming from this arc.
  else if(type === 'arc') {
    //Hide all Arc labels, except the one tied to this connector.
    for(var key4 in arcsById) {
      if(arcsById.hasOwnProperty(key4)) {
        if(key4 !== d.id.toString()) {
          arcHideList.push(key4);
        }
      }
    }

    //Only hide bubble labels not linked to this arc.
    var relatedConnectors = arcsById[d.id].relatedConnectors;

    for(var key5 in bubblesById) {
      if(bubblesById.hasOwnProperty(key5)) {
        var afound = false;

        for(var j = 0; j < relatedConnectors.length; j++) {
          if(key5 === relatedConnectors[j].bubbleId.toString()) {
            afound = true;
            break;
          }
        }

        if(!afound) {
          bubbleHideList.push(key5);
        }
      }
    }

    highlightConnectors(arcsById[d.id], true);
  }

  hideArcLabels(arcHideList, true);
  hideBubbleLabels(bubbleHideList, true);
  updateContentArea(d, type);
}


function onMouseOut(d, type) {
  if(drilling) { return; }

  var arcShowList = [];
  for(var akey in arcsById) {
    if(arcsById.hasOwnProperty(akey)) {
      arcShowList.push(akey);
    }
  }
  hideArcLabels(arcShowList, false);

  var bubbleShowList = [];
  for(var bkey in bubblesById) {
    if(bubblesById.hasOwnProperty(bkey)) {
      bubbleShowList.push(bkey);
    }
  }
  hideBubbleLabels(bubbleShowList, false);

  if(type === 'bubble') {
    highlightConnectors(d, false);
  }
  else if(type === 'connector') {
    highlightConnector(d, false);
  }
  else if(type === 'arc') {
    highlightConnectors(arcsById[d.id], false);
  }

  clearContentArea();
}


function hideArcLabels(labels, hide) {
  labels.forEach(function(label) {
    var arcText = d3.select(document.getElementById('t_' + label));
    arcText.transition()
      .duration((hide === true) ? 550 : 550)
      .style('opacity', (hide === true) ? 0 : 1);
  });
}


function hideBubbleLabels(labels, hide) {
  labels.forEach(function(label) {
    var bubbleText = d3.select(document.getElementById('t_' + label.toString().replace(/&/g, '')));
    bubbleText.transition()
      .duration((hide === true) ? 550 : 550)
      .style('opacity', (hide === true) ? 0 : 1);

    var bubbleCallout = d3.select(document.getElementById('p_' + label.toString().replace(/&/g, '')));
    bubbleCallout.transition()
      .duration((hide === true) ? 550 : 550)
      .style('opacity', (hide === true) ? 0 : 1);
  });
}


function highlightConnector(g, on) {
  var bub = d3.select(document.getElementById('b_' + g.bubbleId));
  bub.transition()
    .duration((on === true) ? 75 : 550)
    .style('fill-opacity', (on === true) ? BUBBLE_FILL_ON_OPACITY : BUBBLE_FILL_OFF_OPACITY);

  var circ = d3.select(document.getElementById('bh_' + g.bubbleId));
  circ.transition()
    .duration((on === true) ? 75 : 550)
    .style('opacity', ((on === true) ? 1 : 0));

  var connector = d3.select(document.getElementById('c_' + g.id));
  connector.transition()
    .duration((on === true) ? 150 : 550)
    .style('fill-opacity', (on === true) ? CONNECTOR_ON_OPACITY : CONNECTOR_OFF_OPACITY)
    .style('stroke-opacity', (on === true) ? CONNECTOR_STROKE_ON_OPACITY : CONNECTOR_STROKE_OFF_OPACITY);

  var arc = d3.select(document.getElementById('a_' + g.id));
  arc.transition()
    .duration((on === true) ? 300 : 550)
    .style('fill-opacity', (on === true) ? CONNECTOR_ARC_ON_OPACITY : CONNECTOR_ARC_OFF_OPACITY);

  var arcText = d3.select(document.getElementById('t_' + g.arcId));
  arcText.transition()
    .duration((on === true) ? 400 : 400)
    .style('opacity', 1);
}


function highlightConnectors(g, on) {
  g.relatedConnectors.forEach(function (d) {
    highlightConnector(d, on);
  });
}



function arcFall(transition) {
  transition.attrTween('d', function(d) {
    var newArc = {};
    var relatedArc = arcsById[d.arcId];
    var relatedArcData = arcDataById[d.arcId];

    newArc.startAngle = relatedArc.startAngle;
    newArc.endAngle = relatedArc.endAngle; //full angle...

    var innerIterpolate = d3.interpolate(innerRadius - 20, 0);
    var outerIterpolate = d3.interpolate(innerRadius, 20);

    return function(t) {
      newArc.innerRadius = innerIterpolate(t);
      newArc.outerRadius = outerIterpolate(t);

      var arc = d3.svg.arc();
      return arc(newArc);
    };
  });
}


function onMouseClick(d, type) {
  clearContentArea();

  if(type === 'bubble') {
    drilling = true;
    drillDirection = 'forward';

    var circ = d3.select(document.getElementById('b_' + d.id));
    circ.transition()
      .style('fill-opacity', 0.3)
      .attr('transform', function(e) {
        var x = bubbleRadius - e.x;
        var y = bubbleRadius - e.y;
        return 'translate(' + x + ', ' + y + ')';
      })
      .duration(550)
      .ease('exp-in')  //cubic, elastic, bounce, linear
      .attr('r', function(f) { return innerRadius; })
      .each('end', function() {
        //fish: focusEntity = graph.getNode(d.id);
        focusEntity = d;
        console.log(focusEntity); //fish: yo
        updateConnectionExplorer();
        drilling = false;
      });
  }
  else if(type === 'arc' || type === 'arcText') {
    drilling = true;
    drillDirection = 'backward';

    var id;
    var arcId;

    if(type === 'arc') {
      id = d.id;
      arcId = d.arcId;
    }
    else {
      //Not so pretty way to get arc from text.
      id = arcsById[d.id].relatedConnectors[0].id;
      arcId = d.id;
    }

    var arc = d3.select(document.getElementById('a_' + id));
    arc.style('fill-opacity', 1.0)
      .transition()
      .duration(550)
      .ease('exp-in')
      .call(arcFall, this)
      .each('end', function() {
        //fish: remove all arcs and connectors when drilling to same node type.
        arcsSvg.selectAll('g.arcs').remove();
        connectorsSvg.selectAll('g.connectors').remove();

        //fish: focusEntity = graph.getNode(arcId);
        focusEntity = d;  //fish: wont' for for text...

        updateConnectionExplorer();
        drilling = false;
      });
  }
}


var currentTable;

function addContentRow(table, data) {
  //Only add if not already there.
  if(currentTable.indexOf(data) === -1) {
    currentTable.push(data);

    var row = $('<tr />');
    table.append(row);
    row.append($('<td>' + data + '</td>'));
  }
}

function updateContentArea(d, type) {
  contentArea.empty();
  currentTable = [];

  if(type === 'bubble') {
    d.relatedConnectors.forEach(function(connector) {
      if(titleMap[connector.id]) {
        titleMap[connector.id].forEach(function(title) {
          addContentRow(contentArea, title);
        });
      }
    });
  }
  else if(type === 'connector') {
    if(titleMap[d.id]) {
      titleMap[d.id].forEach(function(title) {
        addContentRow(contentArea, title);
      });
    }
  }
  else if(type === 'arc') {
    var relatedConnectors = arcsById[d.id].relatedConnectors;

    relatedConnectors.forEach(function(connector) {
      titleMap[connector.id].forEach(function(title) {
        addContentRow(contentArea, title);
      });
    });
  }

  contentArea.attr('class', 'fadeVisible');
}


function clearContentArea() {
  contentArea.attr('class', 'fadeHidden');
}



function updateMaxArcs(value) {
  MAX_ARCS = value;
  createElements();
  updateConnectionExplorer();
}

function updateMaxBubbles(value) {
  MAX_BUBBLES = value;
  createElements();
  updateConnectionExplorer();
}


var autoSelected;

function highlightMostRelevant() {
  setTimeout(function() {
    var highlightThisOne;

    for(var key in bubblesById) {
      if(bubblesById.hasOwnProperty(key)) {
        if(highlightThisOne) {
          if(highlightThisOne.value < bubblesById[key].value) {
            highlightThisOne = bubblesById[key];
          }
        }
        else {
          highlightThisOne = bubblesById[key];
        }
      }
    }

    if(highlightThisOne) {
      onMouseOver(highlightThisOne, 'bubble');
      autoSelected = highlightThisOne;
    }

  }, 1000);
}
