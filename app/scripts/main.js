/*
  Created by Hyperceptive LLC

  Data from: https://data.sfgov.org/City-Management-and-Ethics/Lobbyist-Activity-Contacts-of-Public-Officials/hr5m-xnxc

  From Jan 1, 2010 until yesterday.

  Each Row:

    Date: '2014-11-30T00:00:00'

    DesiredOutcome: 'enforcement of prior settlement agreement; mitigation of construction impact on Store Operations in Union Square'

    FileNumber: 'n/a'

    LobbyingSubjectArea: 'Transportation'

    Lobbyist: 'Yaki, Michael'
    Lobbyist_Client: 'Barneys New York'
    Lobbyist_Firm: 'Michael Yaki'

    MunicipalDecision: 'Construction Impact Of Central Subway'

    Official: 'Yuen, Janis'
    Official_Department: 'Municipal Transportation Agency'

    created_at: 1417625821
    created_meta: '400501'
    id: 'C1C7C9DB-0108-4F5B-8915-7F4D89A632BA'
    meta: null
    position: 262349
    sid: 262349
    updated_at: 1417625821
    updated_meta: '400501'
*/

'use strict';


function expandCollapse(side) {
  if(side === 'Left') {
    $('#chartAreaLeft').toggleClass('expanded');
  }
  else if(side === 'Right') {
    $('#chartAreaRight').toggleClass('expanded');
  }

  if($('#chartAreaLeft').hasClass('expanded')) {
    buildGraphVisual();
  }
  if($('#chartAreaRight').hasClass('expanded')) {
    initConnectionExplorer();
  }
  else {
    //Collapsing...
    if(side === 'Left') {
      buildGraphVisual();
    }
    else if(side === 'Right') {
      initConnectionExplorer();
    }
  }
}




// Open the Arc Bubble visualization.

function openConnectionExplorer() {
  hideContextMenu();

  //If left side expanded, collapse it first.
  if($('#chartAreaLeft').hasClass('expanded')) {
    expandCollapse('Left');
  }

  initConnectionExplorer();
}



function initConnectionExplorer() {
  updateChartData(selectedNode, 'arc');

  initialize();

  updateArcs();
  updateConnectors(relationships);
  updateBubbles();
  updateBubbleLabels();
}


function updateConnectionExplorer(focusEntity, type) {
  updateChartData(focusEntity, type);

  resize();
  buildArcs();
  buildBubbles();

  updateArcs();
  updateConnectors(relationships);
  updateBubbles();
  updateBubbleLabels();
}



//TODO: Make the modal generic and configurable (since we have two, so far...)


//Open popups with connection info -- from Context Menu in Force Directred Graph
function viewConnectionInfo() {
  hideContextMenu();

  var listId = 'toId';
  var nodeType = 'Lobbyist Firm'; //TODO: remove hardcode

  if(selectedNode.group === 2) {
    listId = 'fromId';
    nodeType = 'City Department'; //TODO: remove hardcode
  }

  var label = d3.select('#connectionName').node();

  label.innerHTML = selectedNode.name + ' <small> ' + nodeType + '</small>';

  if(connectionsTable) {
    connectionsTable.destroy();
  }

  contextMenuList = [];

  //TODO: Can I use connected() and index to find more quickly?
  var edges = graph.getAllEdgesOf(selectedNode.name);

  edges.forEach(function(edge) {
    var obj = {};
    obj.name = edge[listId];
    obj.weight = edge.weight;
    obj.weightList = edge.weightList;

    contextMenuList.push(obj);
  });

  contextMenuList.sort(weightDesc);

  //Add the rows to the table.
  $('#connectionsTableBody').empty();

  contextMenuList.forEach(function(listItem) {
    addConnectionsRow(listItem);
  });

  $('#openModal')
    .css('opacity', 1)
    .css('pointer-events', 'auto');

  var modalHeight = document.getElementById('openModalDiv').clientHeight;
  var eightyP = parseInt(window.innerHeight * 0.8) - 170;

  if(modalHeight > eightyP) {
    modalHeight = eightyP;
  }

  connectionsTable = $('#connectionsTable').DataTable({
    paging: false,
    scrollY: modalHeight,
    columns: [
        null,
        { width: '120px', className: 'dt-right' },
        { width: '120px', className: 'dt-center' },
      ]
  });

}

function addConnectionsRow(data) {
  var row = $('<tr />');
  $('#connectionsTableBody').append(row);
  row.append($('<td>' + data.name + '</td>'));
  row.append($('<td>' + data.weight + '</td>'));
  row.append($('<td><button class="linkButton" onclick="viewConnectionDetails(\'' + data.name + '\')">View Details</button></td>'));
}


function closeConnectionsModal() {
  $('#openModal')
    .css('opacity', 0)
    .css('pointer-events', 'none');
}




// Open connection details from Force Directed Graph.
function viewConnectionDetails(name) {
  var weightList;

  for(var i=0; i < contextMenuList.length; i++) {
    if(name === contextMenuList[i].name) {
      weightList = contextMenuList[i].weightList;
      break;
    }
  }

  var label = d3.select('#detailsName').node();

  label.innerHTML = selectedNode.name + ' <small> Connections with ' + name + '</small>';

  if(detailsTable) {
    detailsTable.destroy();
  }

  //Add the rows to the table.
  $('#detailsTableBody').empty();

  weightList.forEach(function(listItem) {
    addDetailsRow(listItem);
  });

  $('#openDetailsModal')
    .css('opacity', 1)
    .css('pointer-events', 'auto');

  var modalHeight = document.getElementById('openModalDiv').clientHeight;
  var eightyP = parseInt(window.innerHeight * 0.8) - 170;

  if(modalHeight > eightyP) {
    modalHeight = eightyP;
  }

  detailsTable = $('#detailsTable').DataTable({
    paging: false,
    scrollY: modalHeight,
    columnDefs: [
       { type: 'de_date', targets: 0 }
     ]
  });

}


function addDetailsRow(data) {
  var row = $('<tr />');

  var d1 = new Date(data.Date);
  var month = (d1.getMonth() + 1).toString();
  var day = d1.getDate().toString();
  var d2 = d1.getFullYear() + '-' + (month.length === 1 ? '0' + month : month) + '-' + (day.length === 1 ? '0' + day : day);

  $('#detailsTableBody').append(row);
  row.append($('<td>' + d2 + '</td>'));
  row.append($('<td>' + data.LobbyingSubjectArea + '</td>'));
  row.append($('<td>' + data.MunicipalDecision + '</td>'));
  row.append($('<td>' + data.DesiredOutcome + '</td>'));
  row.append($('<td>' + data.Lobbyist_Client + '</td>'));
  row.append($('<td>' + data.Official + '</td>'));
}


function closeDetailsModal() {
  $('#openDetailsModal')
    .css('opacity', 0)
    .css('pointer-events', 'none');
}





function buildGraphVisual() {
  d3.json('data/lobbyistsContacts.json', function(error, lobbyistsContacts) {
    if(error) throw error;

    if($('#chartAreaLeft').hasClass('expanded')) {
      width = window.innerWidth - 28; //1400
    }
    else {
      width = (window.innerWidth / 2) - 18; //divide by 2 if not expanded....
    }

    height = window.innerHeight - 98;  //86  //800  (top bar is ~66px)

    buildForceDirectedGraph(height, width, '#svgChartLeft', lobbyistsContacts);
  });
}


buildGraphVisual();
