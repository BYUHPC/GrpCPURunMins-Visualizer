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

var Fsl = {};


Fsl.CpuTimeRemaining = {};

Fsl.CpuTimeRemaining.Job = function(walltime, cores) {
  this.cores = cores;
  this.walltime = walltime;
  this.time_to_deduct = cores;
  this.cpu_time = cores * walltime;
};


Fsl.CpuTimeRemaining.Form = function(id, color, renderer) {

  this.html_id = 'simulation' + id;
  this.id = id;
  this.color = color;

  this.attach = function(to) {
    var previous = this.form.lastChild;
    to.appendChild(this.form);
    //if (!form.nextSibling) {
      //previous.appendChild(this.createButton('+', 'inc', function() {
        
      //}));
    //}
    //if (form.previousSibling) {
      //previous.appendChild(this.createButton('-', 'dec', removeForm);
    //}

  }

  this.detach = function() {
    this.form.parentNode.removeChild(this.form);
  }

  // private

  function createInputWithLabel(name, description, required) {
    var input = document.createElement('input');
    input.setAttribute('name', name);
    input.setAttribute('size', 8);
    input.setAttribute('type', 'text');
    if (required) {
      input.setAttribute('required', '');
    }

    var label = document.createElement('label');
    label.appendChild(document.createTextNode(description));
    label.appendChild(input);
    return label;
  }

  this.createButton = function(value, button_class, listener) {
    var button = document.createElement('button');
    button.classList.add(button_class);
    button.appendChild(document.createTextNode(value));
    button.addEventListener('click', listener);
    return button;
  } 

  this.createForm = function() {
    var form = document.createElement('form');
    form.setAttribute('id', this.html_id);
    form.classList.add(color);

    var fieldset = document.createElement('fieldset');
    var legend = document.createElement('legend');
    legend.appendChild(document.createTextNode('Simulation #' + id));
    fieldset.appendChild(legend);
    fieldset.appendChild(createInputWithLabel('JobWalltimeHours', 'Job Walltime (hours)', true));
    fieldset.appendChild(createInputWithLabel('JobCores', 'Cores per job', true));
    fieldset.appendChild(createInputWithLabel('GrpCPURunMins', 'Group CPU Run Mins', true));
    fieldset.appendChild(createInputWithLabel('jobs', 'Jobs', false));

    var submit = document.createElement('button');
    submit.setAttribute('form', this.html_id);
    submit.setAttribute('type', 'submit');
    submit.appendChild(document.createTextNode('Update Chart'));

    var formadd = document.createElement('span');
    formadd.setAttribute('id', 'formadd' + id);
    formadd.classList.add('formadd');

    form.appendChild(fieldset);
    form.appendChild(submit);
    form.appendChild(formadd);

    form.addEventListener('submit', function(event) {
      event.preventDefault();
      renderer(form, id);
    });

    return form;
  }

  this.form = this.createForm();

}


Fsl.CpuTimeRemaining.calculate_number_of_jobs_to_run = function(walltime, cores, GRPCpuRunHrs) {
  var MAGIC_CONSTANT = 5; 
  return GRPCpuRunHrs / (walltime / 2 ) / cores * MAGIC_CONSTANT;
};


/**
 * This class implements the ECMAScript 6 protocol for iterators, as 
 * documented by MDN: 
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/The_Iterator_protocol
 *
 * At the time of this writing the iterator API is not available in mainstream
 * browsers, so instead of using the for..of syntax of ES6 you need to 
 * manually iterate by calling .next()
 */
Fsl.CpuTimeRemaining.Simulation = function(walltime, cores, jobs, GRPCpuRunHrs) {
//public API:
  this.next = function() {
    var time_remaining = this.update_running_jobs_and_sum_time_remaining();
    this.move_finished_jobs();
    this.start_new_jobs(time_remaining);
    return {
        value: this.calculate_cpus_in_use(),
        done: !this.has_next()
    };
  };

//private API:
  this.jobs = [];
  this.job = new Fsl.CpuTimeRemaining.Job(walltime, cores);
  this.run_ndx = 0;
  this.queue_ndx = 0;

  this.update_running_jobs_and_sum_time_remaining = function() {
    var sum = 0;
    for (var i = this.run_ndx; i < this.queue_ndx; ++i) {
      var j = Math.max(0, this.jobs[i] - this.job.time_to_deduct);
      this.jobs[i] = j;
      sum += j;
    }
    return sum;
  };

  this.move_finished_jobs = function() {
    var i;
    for (i = this.run_ndx; i < this.queue_ndx; ++i) {
      if (this.jobs[i] > 0) {
        break;
      }
    }
    this.run_ndx = i;
  };

  this.calculate_time_to_fill_with_new_jobs = function(time_remaining) {
    return GRPCpuRunHrs - time_remaining;
  };

  this.calculate_jobs_that_fit_in = function(time_to_fill) {
    return Math.floor(time_to_fill / this.job.cpu_time);
  };

  this.start_n_jobs = function(n) {
    this.queue_ndx += Math.min(n, this.jobs.length - this.queue_ndx);
  };

  this.start_new_jobs = function(time_remaining) {
    var time_to_fill = this.calculate_time_to_fill_with_new_jobs(time_remaining);
    var jobs_to_start = this.calculate_jobs_that_fit_in(time_to_fill);
    this.start_n_jobs(jobs_to_start);
  };

  this.calculate_cpus_in_use = function() {
    return (this.queue_ndx - this.run_ndx) * this.job.cores;
  };

  this.has_next = function() {
    return this.run_ndx < this.jobs.length;
  };

  for (var i = 0; i < jobs; ++i) {
    this.jobs.push(this.job.cpu_time);
  }

};
