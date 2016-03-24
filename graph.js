"use strict";

/*
Copyright (C) 2014, Brigham Young University

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License
along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

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

var next_form_id = 0;
var inc_button = document.createElement('button');
inc_button.classList.add('inc');
inc_button.appendChild(document.createTextNode('+'));
inc_button.addEventListener('click', addForm);

var dec_button = document.createElement('button');
dec_button.classList.add('dec');
dec_button.appendChild(document.createTextNode('-'));
dec_button.addEventListener('click', removeForm);

var max_forms = chart_colors_class.length;
var max_form_id = max_forms - 1;

var svg;
document.addEventListener('DOMContentLoaded', function(){
    svg = d3.select("div#graph").select("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
              .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    addForm();
    redrawTicks();
 });

function addFormButtons(id) {
    var formadd = document.getElementById('formadd' + id);
    if (id > 0) {
        formadd.appendChild(dec_button);
    }
    if (id < max_form_id) {
        formadd.appendChild(inc_button);
    }
}

function removeForm() {
    // can't remove the last form
    if (next_form_id === 0) {
        return;
    }
    line_data[--next_form_id] = [];
    var simulation = document.getElementById('simulation' + next_form_id);
    simulation.parentNode.removeChild(simulation);
    addFormButtons(next_form_id-1);
    redraw();
}

function createInputWithLabel(name, description, required) {
  var input = document.createElement('input');
  input.setAttribute('name', name);
  input.setAttribute('size', 8);
  input.setAttribute('type', 'number');
  // add a default value for GrpCPURunMins if one exists
  if (name === "GrpCPURunMins") {
      input.setAttribute("value", document.getElementById("defaultGrpCPURunMins").innerHTML);
  }
  if (required) {
    input.setAttribute('required', '');
    // setup custom validation on the input fields
    input.oninput = sanityCheck;
  }
  
  var label = document.createElement('label');
  label.appendChild(document.createTextNode(description));
  if (name === "GrpCPURunMins"){
    var question_span = document.createElement("span");
    question_span.setAttribute("class", "help_parent");
    
    var popup_div = document.getElementById("GrpCPURunMinsHelp").cloneNode(true);
    popup_div.removeAttribute("id");
//    popup_div.setAttribute("style", "display: none;");
    
    var img = document.createElement("img");
    img.src = "question_mark.jpg";
    img.alt = popup_div.innerHTML;
    question_span.appendChild(img);
    question_span.appendChild(popup_div);
    label.appendChild(question_span);
  }
  
  // special handling for the Job Walltime
  if (name === "JobWalltimeHours") {
    var select_box = document.createElement('select');
    select_box.setAttribute('name', 'JobWalltimeUnits');
    var select_days = document.createElement("option");
    select_days.setAttribute("value", "days");
    select_days.innerHTML = "Days";
    var select_hours = document.createElement("option");
    select_hours.setAttribute("value", "hours");
    select_hours.innerHTML = "Hours";
    // apparently minutes is too fine grained to be useful so I removed it
    select_box.appendChild(select_hours);
    select_box.appendChild(select_days);
    //the first form should have an usable select box, and all the other forms should
    //match whatever they choose since it would make sens eto compare different
    //units on the x axis to begin with.
    if (next_form_id === 0) {
      // add a listener to this select to update all the text versions of this select
      select_box.onchange = function(e) {
        var elements = document.getElementsByName("JobWalltimeUnits");
        for (var i=0; i < elements.length; ++i) {
          elements[i].selectedIndex = e.target.options.selectedIndex;
        }
      };
    } else {
      select_box.disabled = true;
      select_box.setAttribute("name", "JobWalltimeUnits");
      var select_unit = document.getElementById("simulation0").JobWalltimeUnits;
      select_box.selectedIndex = select_unit.options.selectedIndex;
    }
    label.appendChild(select_box);
    // make the label choose the input field instead of the select box
    label.setAttribute("for", "JobWalltimeHours");
  }
  label.appendChild(input);
  return label;
}

function createForm(id, color) {
  var name = 'simulation' + id;
  var form = document.createElement('form');
  form.setAttribute('id', name);
  form.classList.add(color);

  var fieldset = document.createElement('fieldset');
  var legend = document.createElement('legend');
  legend.appendChild(document.createTextNode('Simulation #' + id));
  fieldset.appendChild(legend);
  fieldset.appendChild(createInputWithLabel('JobWalltimeHours', 'Job Walltime ', true));
  fieldset.appendChild(createInputWithLabel('JobCores', 'Cores per job ', true));
  fieldset.appendChild(createInputWithLabel('GrpCPURunMins', 'GrpCPURunMins Limit ', true));
  var jobs_field = fieldset.appendChild(createInputWithLabel('jobs', 'Jobs ', false));
  // hide the jobs field 
  // TODO make a separate button to reveal this field
  jobs_field.style.display = "none";

  var submit = document.createElement('button');
  submit.setAttribute('form', name);
  submit.setAttribute('type', 'submit');
  submit.appendChild(document.createTextNode('Update Chart'));

  var formadd = document.createElement('span');
  formadd.setAttribute('id', 'formadd' + id);
  formadd.classList.add('formadd');

  form.appendChild(fieldset);
  form.appendChild(submit);
  form.appendChild(formadd);
  return form;
}

function addForm() {
    // can't add more forms than we have colors for just cause I said so :p
    // if you REALLY wanna reuse colors you can just find the add color part and mod it over the length
    if (next_form_id === max_forms) {
        return;
    }
    var id = next_form_id;

    var simulation = createForm(id, chart_colors_class[id]);
    var formset = document.getElementById('formset');
    formset.appendChild(simulation);
    simulation.addEventListener('submit', function(event) {
        event.preventDefault();
        render(simulation, id);
    });
    // remove the buttons from the previous form if any
    if (next_form_id !== 0) {
        var formadd = document.getElementById('formadd' + (next_form_id - 1));
        while (formadd.lastChild) {
            formadd.removeChild(formadd.lastChild);
        }
    }
    // add form buttons to the new form
    addFormButtons(next_form_id++);
}

function sanityCheck() {
    var JobWalltimeUnits, JobWalltimeHours, JobCores, GrpCPURunMins;
    // fill the above variables with the correct DOM elements regardless of which triggered the event
    var labels = this.parentNode.parentNode.childNodes;
    for (i = 0; i < labels.length; i++) {
        if (labels[i].hasChildNodes() && labels[i].lastChild.tagName == "INPUT" ) {
            var input = labels[i].lastChild;
            switch (input.getAttribute("name")) {
                case "JobWalltimeHours":
                    JobWalltimeHours = input;
                    JobWalltimeUnits = input.previousSibling;
                    break;
                case "JobCores":
                    JobCores = input;
                    break;
                case "GrpCPURunMins":
                    GrpCPURunMins = input;
                    break;
            }
        }
    }

    if (!JobWalltimeHours.value || !JobCores.value || !GrpCPURunMins.value) {
        return false;
    }
    var JobWalltime = JobWalltimeHours.value;
    var JobCores = JobCores.value;
    // convert the JobWalltime to hours
    if (JobWalltimeUnits.value === "days") {
        JobWalltime *= 24;
    }
    // convert the GrpCPURunMins to hours as well
    var GrpCPURunHrs = Math.floor(GrpCPURunMins.value / 60);

    // sanity check, if the GrpCPURunMins < Job Cores * Job Walltime, then a job can never start so it will never finish
    if (GrpCPURunHrs < JobCores * JobWalltime) {
        GrpCPURunMins.setCustomValidity("The GrpCPURunMins cannot be less than Job Cores * Job Walltime");
    } else {
        GrpCPURunMins.setCustomValidity("");
    }
}

// TODO if performance becomes an issue, cache previous graph results
//var history_cache = {};

// line data holds the data for each of the current graphs drawn so it doesn't 
// have to recalculate if the user changes only one graph
var line_data = new Array(max_forms);
for (var i = 0; i < max_forms; i++) {
  line_data[i] = [];
}
function render(form, id) {
    // TODO: Hide the jobs field and compute it (DONE) unless they check the advanced buttons (NOT DONE)
    // TODO: Cache the results for previous histories
    var data = [];
    // check that all the fields are filled out. Sometimes the html5 required doesn't play nice
    if (!form.JobWalltimeHours.value || !form.JobCores.value || !form.GrpCPURunMins.value) {
        return false;
    }
    var JobWalltime = form.JobWalltimeHours.value;
    var JobCores = form.JobCores.value;
    var GrpCPURunMins = form.GrpCPURunMins.value;
    var JobWalltimeUnits = form.JobWalltimeUnits.value;
    // convert the JobWalltime to hours
    if (JobWalltimeUnits === "days") {
        JobWalltime *= 24;
    }
    // convert the GrpCPURunMins to hours as well
    var GrpCPURunHrs = Math.floor(GrpCPURunMins / 60);
        
    // sanity check, if the GrpCPURunMins < Job Cores * Job Walltime, then a job can never start so it will never finish
    if (GrpCPURunHrs < JobCores * JobWalltime) {
        form.GrpCPURunMins.setCustomValidity("The GrpCPURunMins cannot be less than Job Cores * Job Walltime");
        return;
    }
    var jobs = Fsl.CpuTimeRemaining.calculate_number_of_jobs_to_run(JobWalltime, JobCores, GrpCPURunHrs);
    var simulation = new Fsl.CpuTimeRemaining.Simulation(JobWalltime, JobCores, jobs, GrpCPURunHrs);
    for (var n = simulation.next(); !n.done; n = simulation.next()) {
      data.push(n.value);
    }
    line_data[id] = data;
    redraw();
}
function redraw() {
    // determine the x and y min max by finding the biggest x and biggest y in all the lines
    var x_max = d3.max(line_data, function(line) {
            return line.length-1;
        }) || 1.0;
    x.domain([0, x_max]);
    var y_max = d3.max(line_data, function(line) {
            return d3.max(line);
        }) || 1.0;
    y.domain([0, y_max]);
    redrawTicks();
    // need to remove them all and redraw them with the new scale
    svg.selectAll("path.line")
         .remove();
    for (var i = 0; i <= max_form_id; i++) {
        svg.append("path")
             .datum(line_data[i])
             .attr("class", "line " + chart_colors_class[i])
             .attr("d", line);
    }
}
     
function redrawTicks() {
    // clear the previous axis
    svg.selectAll("g.x.axis").remove();
    svg.selectAll("g.y.axis").remove();
    // redraw the new axis according to the right scale
    // also get the current units
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis.ticks(10)
            .tickSize(-height, 0, 0)
        ).append("text")
            .attr("dx", ".71em")
            .style("text-anchor", "start")
            .attr("y", -6)
            .text("Hours");
    svg.append("g")         
        .attr("class", "y axis")
        .call(yAxis.ticks(10)
            .tickSize(-width, 0, 0)
        ).append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Cores");
    // This is a fix for desktop renderers that don't support css. we can inline all
    // the css as line attributes 
    svg.selectAll("g.x.axis line").attr({
            "fill" : "none",
            "shape-rendering" : "crispEdges",
            "stroke" : "lightgrey",
            "stroke-width" : "1px",
            "style" : "opacity: 0.7"
        });
    svg.selectAll("g.y.axis line").attr({
            "fill" : "none",
            "shape-rendering" : "crispEdges",
            "stroke" : "lightgrey",
            "stroke-width" : "1px",
            "style" : "opacity: 0.7"
        });
    // recolor the labelled axis lines 
    svg.select("g.x.axis path").attr({
                "stroke": "black",
                "stroke-width": "1px"
            });
    svg.select("g.y.axis path").attr({
                "stroke": "black",
                "stroke-width": "1px"
            });
}

function saveAsSvg() {
    var html = document.getElementById("graph").innerHTML;
//    var html = svg.html();
    var a = document.createElement("a");
    var datauri = "data:image/svg+xml;base64," + btoa(html);
    a.download = "graph.svg";
    a.href = datauri;
    // firefox didn't like the obvious a.click() so this is a workaround that seems to work
    var clickEvent = new MouseEvent("click", {
        "view": window,
        "bubbles": true,
        "cancelable": false
    });
    a.dispatchEvent(clickEvent);
}
