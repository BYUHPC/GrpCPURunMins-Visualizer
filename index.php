<?php
require_once("setup.php");

requireAdmin();

$template = new Fsl\Template();
ob_start(); 
?>

<form onsubmit="javascript:sendAjax(this); return false;">
    <fieldset>
        <legend>Simulation Parameters</legend>
        <label for="hours" class="simulation">Hours <input name="hours" size="5" type="text" class="simulation"></label>
        <label for="cores" class="simulation">Cores <input name="cores" size="5" type="text" class="simulation"></label>
        <label for="jobs" class="simulation">Jobs <input name="jobs" size="5" type="text" class="simulation"></label>
        <label for="gcrmins" class="simulation">Group CPU Run Mins <input name="gcrmins" size="5" type="text" class="simulation"></label>
    </fieldset>
    <input type="submit" value="Update Chart">
</form>
<div id="graph"></div>
<script src="http://d3js.org/d3.v3.min.js" charset="utf-8"></script>
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

function sendAjax(form){
    // TODO: Hide the jobs field and compute it unless they check the advanced buttons
    // TODO: Cache the results for previous histories
    d3.json("http://localhost/simulation/simulation.php?"+$(form).serialize(), function(error, data) {
        if (error) {
            return;
        }
        x.domain([0, data["data"].length-1]);
        y.domain([0, d3.max(data["data"])]);
        svg.selectAll("g.x.axis")
             .call(xAxis);
        svg.selectAll("g.y.axis")
             .call(yAxis);
        svg.selectAll("path.line")
             .remove();
        svg.append("path")
             .datum(data["data"])
             .attr("class", "line " + "red")
             .attr("d", line);
    });
}
</script>


<?php

$content = ob_get_clean();

echo $template
    ->title('Walltime Simulation')
    ->addStylesheet("/css/".get_current_template()."/simulation/simulationGraph.css")
    ->appendBreadcrumbs(array(
        array('text'=>'Simulation', 'url'=>'/simulation/')
    ))->assignContent($content)
    ->saveHtml();