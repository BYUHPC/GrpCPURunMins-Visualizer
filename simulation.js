"use strict";

var Fsl = {};


Fsl.CpuTimeRemaining = {};

Fsl.CpuTimeRemaining.Job = function(walltime, cores) {
  this.cores = cores;
  this.walltime = walltime;
  this.time_to_deduct = cores;
  this.cpu_time = cores * walltime;
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
Fsl.CpuTimeRemaining.Simulation = function(walltime, cores, GRPCpuRunHrs) {
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

  this.calculate_number_of_jobs_to_run = function() {
    var MAGIC_CONSTANT = 5; 
    return GRPCpuRunHrs / (walltime / 2 ) / cores * MAGIC_CONSTANT;
  };

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

  for (var i = 0; i < this.calculate_number_of_jobs_to_run(); ++i) {
    this.jobs.push(this.job.cpu_time);
  }

};
