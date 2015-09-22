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



var currentFocusNode, currentType;

function initConnectionExplorer() {
  currentFocusNode = selectedNode;
  currentType = 'arc';

  updateChartData(currentFocusNode, currentType);

  initialize();

  updateArcs();
  updateConnectors(relationships);
  updateBubbles();
  updateBubbleLabels();
}


function updateConnectionExplorer(focusEntity, type) {
  if(typeof focusEntity !== 'undefined') {
    currentFocusNode = focusEntity;
  }

  if(typeof type !== 'undefined') {
    currentType = type;
  }

  updateChartData(currentFocusNode, currentType);

  resize();
  buildArcs();
  buildBubbles();

  updateArcs();
  updateConnectors(relationships);
  updateBubbles();
  updateBubbleLabels();
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







//Open popup with connection info -- from Context Menu in Force Directred Graph
/* new one (fish)
function viewConnectionInfo() {
  hideContextMenu();

  var listId = 'toId';
  var nodeType = GROUP1.replace(/_/g, ' ');

  var header1 = d3.select('#connectionHeader1').node();
  var header2 = d3.select('#connectionHeader2').node();
  var header3 = d3.select('#connectionHeader3').node();

  //Yuck - hardcode...
  header1.innerHTML = 'Lobbyist Client';
  header2.innerHTML = 'Official Department';
  header3.innerHTML = 'Official';

  if(selectedNode.group === 2) {
    listId = 'fromId';
    nodeType = GROUP2.replace(/_/g, ' ');

    //Yuck - hardcode...
    header1.innerHTML = 'Official';
    header2.innerHTML = 'Lobbyist Firm';
    header3.innerHTML = 'Lobbyist Client';
  }

  var label = d3.select('#connectionName').node();
  label.innerHTML = selectedNode.name + ' <small> ' + nodeType + '</small>';

  if(connectionsTable) {
    connectionsTable.destroy();
  }

  var contextMenuMap = {};

  var edges = graph.getAllEdgesOf(selectedNode.name);

  edges.forEach(function(edge) {
    edge.weightList.forEach(function(connection) {
      var mapKey = edge[listId] + ':' + connection.Official + ':' + connection.Lobbyist_Client; // + ':' + connection.LobbyingSubjectArea + ':' + connection.MunicipalDecision + ':' + connection.DesiredOutcome;

      if(!contextMenuMap.hasOwnProperty(mapKey)) {
        var obj = {};
        obj.name = edge[listId];
        obj.Date = connection.Date;
        obj.Official = connection.Official;
        obj.Lobbyist_Client = connection.Lobbyist_Client;
        obj.Lobbyist_Firm = connection.Lobbyist_Firm;
        //obj.LobbyingSubjectArea = connection.LobbyingSubjectArea;
        //obj.MunicipalDecision = connection.MunicipalDecision;
        //obj.DesiredOutcome = connection.DesiredOutcome;
        obj.numContacts = 1;

        contextMenuMap[mapKey] = obj;
      }
      else {
        contextMenuMap[mapKey].numContacts++;
      }
    });
  });

  //Add the rows to the table.
  $('#connectionsTableBody').empty();

  for(var key in contextMenuMap) {
    if(contextMenuMap.hasOwnProperty(key)) {
      addConnectionsRow(contextMenuMap[key]);
    }
  }

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
    //columns: [
    //    { type: 'de_date', targets: 0 },
    //    { width: '120px', className: 'dt-right' },
    //    { width: '120px', className: 'dt-center' },
    //  ]
  });

}

function addConnectionsRow(data) {
  var row = $('<tr />');

  //fish: date
  //var d1 = new Date(data.Date);
  //var month = (d1.getMonth() + 1).toString();
  //var day = d1.getDate().toString();
  //var d2 = d1.getFullYear() + '-' + (month.length === 1 ? '0' + month : month) + '-' + (day.length === 1 ? '0' + day : day);

  $('#connectionsTableBody').append(row);
  row.append($('<td>' + data.Date + '</td>'));
  row.append($('<td>' + data.name + '</td>'));

  if(selectedNode.group === 1) {
    row.append($('<td>' + data.Official_Department + '</td>'));
    row.append($('<td>' + data.Official + '</td>'));
  }
  else {
    row.append($('<td>' + data.Lobbyist_Firm + '</td>'));
    row.append($('<td>' + data.Lobbyist_Client + '</td>'));
  }


  row.append($('<td>' + data.numContacts + '</td>'));
  row.append($('<td><button class="linkButton" onclick="viewConnectionDetails(\'' + data.name + '\')">View Details</button></td>'));
}



function closeConnectionsModal() {
  $('#openModal')
    .css('opacity', 0)
    .css('pointer-events', 'none');
}
*/






/* fish */
//Open popups with connection info -- from Context Menu in Force Directred Graph
var contextMenuList = [];

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
/* fish end */




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
