GrpCPURunMins-Visualizer
========================

A visualization of a user's jobs interacting with the GrpCPURunMins limit in SLURM.

Demo
====

A live demo of the graph [can be found here](https://marylou.byu.edu/simulation/grpcpurunmins.php)

Dependencies
============

The only external JavaScript dependency is [d3.js](http://d3js.org/) and this is 
loaded as a resource from cdnjs.cloudflare.com

Usage
============

Probably the simplest way to use the library is to load the `index.html` page.
The files `index.html` and `simulation.css` are both examples of the 
library and are released under the public domain. The essence of 
the formset, the graph drawing, and the simulation are all fairly decoupled which
means that you can use them as an external library and comply with the LGPL.

If you want to simply embed the graph in an existing template, the `index.html` is 
designed to be embeddable within your own sites template. To see one 
possible way to embed the graph, look at the live demo. On this page, the actual
graphing library is added as a git submodule and the PHP page loads the graph 
in an `iframe` and afterwards fills in the default values. The default values for 
GrpCPURunMins limit had to be retrieved from the database, so there is a little 
JavaScript snippet at the bottom of the page that loads this limit into the `iframe`.
The code to access and load this can be loaded into the `iframe` is as follows

    var MyGrpCPURunMins = (LIMIT_FROM_DB);
    (function(){
        $('#graph_page').load(function() {
            $('#graph_page').contents().find("#defaultGrpCPURunMins").html(MyGrpCPURunMins);
            // since this gets added after the page loads, we will add it 
            // explicitly for the first form as well
            $('#graph_page').contents()
                .find("#simulation0")
                .find("input[name='GrpCPURunMins']")
                .val(MyGrpCPURunMins);
        });
    })();

License
=======

The code is licensed under the LGPL V3 (see LICENSE for more information)

The pages `index.html` and `simulation.css` are under the Public Domain and can
be used as a reference for creating your own frontend to the library.