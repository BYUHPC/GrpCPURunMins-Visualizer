<?php
require_once("setup.php");

requireAdmin();

$template = new Fsl\Template(array('loadJsAtTop' => true));
ob_start(); 
?>

<div id="form-template" style="display: none;">
<form style="display: inline-block;" id="simulation{{id}}" onsubmit="javascript:sendAjax(this, {{id}}); return false;"> 
    <fieldset>
        <legend>Simulation Parameters #{{id}}</legend>
        <label for="hours" class="simulation">Hours <input name="hours" size="5" type="text" class="simulation"></label> 
        <label for="cores" class="simulation">Cores <input name="cores" size="5" type="text" class="simulation"></label>
        <label for="jobs" class="simulation">Jobs <input name="jobs" size="5" type="text" class="simulation"></label> 
        <label for="gcrmins" class="simulation">Group CPU Run Mins <input name="gcrmins" size="5" type="text" class="simulation"></label>
    </fieldset>
    <input type="submit" value="Update Chart">
    <div>Compare Plots <span id="formadd{{id}}"></span></div>
</form>
</div>

<div id="formset" class="formset"></div>
<div id="graph"></div>
<div id="loading" class="loading-spinner">
  <p><img src="/css/nova/simulation/ajax-loader.gif" /> Please Wait</p>
</div>

<script src="//cdnjs.cloudflare.com/ajax/libs/d3/3.4.6/d3.js" charset="utf-8"></script>
<script>

var margin = {top: 20, right: 20, bottom: 30, left: 100},
    width = 1080 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var x = d3.scale.linear()
    .range([0, width]);

var y = d3.scale.linear()
    .range([height, 0]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");

var line = d3.svg.line()
    .x(function(d,i) { return x(i); })
    .y(function(d) { return y(d); });

var svg = d3.select("div#graph").append("svg")
     .attr("width", width + margin.left + margin.right)
     .attr("height", height + margin.top + margin.bottom)
   .append("g")
     .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
svg.append("g")
     .attr("class", "x axis")
     .attr("transform", "translate(0," + height + ")")
     .call(xAxis)
   .append("text")
     .attr("dx", ".71em")
     .style("text-anchor", "start")
     .attr("y", -6)
     .text("Hours");

svg.append("g")
     .attr("class", "y axis")
     .call(yAxis)
   .append("text")
     .attr("transform", "rotate(-90)")
     .attr("y", 6)
     .attr("dy", ".71em")
     .style("text-anchor", "end")
     .text("Cores");

var current_id = 0;
var plus_template = '<span class="inc button">+</span>';
var minus_template = '<span class="dec button">-</span>';
// want more comparisons? add more colors to this spot
var chart_colors_class = ["blue", "red", "green"];
var max_forms = chart_colors_class.length;

function addFormButtons(id) {
    if (id !== max_forms-1) {
        $("#formadd"+id).append(plus_template);
    }
    if (id !== 0) {
        $("#formadd"+id).append(minus_template);
    }
    // a little wasteful, but it think it is not a big deal
    $(".dec").click(removeForm);
    $(".inc").click(addForm);
}

function removeForm() {
    // can't remove the last form
    if (current_id === 0) {
        return;
    }
    $("#simulation"+(--current_id)).remove();
    addFormButtons(current_id-1);
}

function addForm() {
    // can't add more forms than we have colors for just cause I said so :p
    // if you REALLY wanna reuse colors you can just find the add color part and mod it over the length
    if (current_id === max_forms) {
        return;
    }
    // for some stupid reason, I can't use replace on the htmlString. Instead
    // I have to do the split join trick to get it to work
    $("#formset").append($('#form-template').html().split("{{id}}").join(current_id));
    // remove the buttons from the previous form if any
    if (current_id !== 0) {
        $("#formadd"+(current_id-1)).empty();
    }
    // add form buttons to the new form
    addFormButtons(current_id++);
}

var history_cache = {};
var line_data = new Array(max_forms);
function sendAjax(form, id){
    // TODO: Hide the jobs field and compute it unless they check the advanced buttons
    // TODO: Cache the results for previous histories
    
    $('#loading').show();
    d3.json("/simulation/simulation.php?"+$(form).serialize(), function(error, data) {
        $('#loading').hide();
        if (error) {
            // TODO display an error message
            return;
        }
        line_data[id] = data["data"];
        // determine the x and y min max by finding the biggest x and biggest y in all the lines
        x.domain([0, d3.max(line_data, function(line){
                if (!line) {
                    return NaN; 
                }
                return line.length-1;
            })]);
        y.domain([0, d3.max(line_data, function(line){
                if (!line){
                    return NaN;
                }
                return d3.max(line);
            })]);
        redrawTicks();
        svg.selectAll("g.x.axis")
             .call(xAxis);
        svg.selectAll("g.y.axis")
             .call(yAxis);
        // need to remove them all and redraw them with the new scale
        svg.selectAll("path.line")
             .remove();
        for (i=0; i<current_id; i++) {
            if (!line_data[i]) {
                continue;
            }
            svg.append("path")
                 .datum(line_data[i])
                 .attr("class", "line " + chart_colors_class[i])
                 .attr("d", line);
        }
    });
}

     
function redrawTicks() {
//    svg.selectAll("g.grid.path").remove();
//    svg.append("g")         
//        .attr("class", "grid")
//        .attr("transform", "translate(0," + height + ")")
//        .call(xAxis.ticks(16)
//            .tickSize(-height, 0, 0)
//            .tickFormat("")
//        );
//    svg.append("g")         
//        .attr("class", "grid")
//        .call(yAxis.ticks(16)
//            .tickSize(-width, 0, 0)
//            .tickFormat("")
//        );
}

// parse any query string params and if they are all there then we can fill in the
// form and generate a graph in advance with it
var urlParams;
(window.onpopstate = function () {
    var match,
        pl     = /\+/g,  // Regex for replacing addition symbol with a space
        search = /([^&=]+)=?([^&]*)/g,
        decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
        query  = window.location.search.substring(1);

    urlParams = {};
    while (match = search.exec(query))
       urlParams[decode(match[1])] = decode(match[2]);
})();
$(function(){
    redrawTicks();
    addForm();
    if (urlParams && urlParams[""]) {
        // TODO fill in the form and call the ajax with the data
    }
});
</script>

<?php

$content = ob_get_clean();

echo $template
    ->title('Walltime Simulation')
    ->addStylesheet("/css/".get_current_template()."/simulation/simulationGraph.css")
    ->addStylesheet("/css/".get_current_template()."/simulation/print.css")
    ->appendBreadcrumbs(array(
        array('text'=>'Simulation', 'url'=>'/simulation/')
    ))->assignContent($content)
    ->saveHtml();
