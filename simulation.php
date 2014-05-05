<?php
// TODO : fix the path problems :(
//require_once 'Fsl/RemainingCpuTimeSimulation/JobList.php';
//require_once 'Fsl/RemainingCpuTimeSimulation/Simulation.php';
//require_once 'Fsl/RemainingCpuTimeSimulation/SimulationFactory.php';
require 'bootstrap.php';

use Fsl\RemainingCpuTimeSimulation\SimulationFactory;
// check that the request is an ajax request
// didn't seem to work right with d3.js
//if (empty($_SERVER['HTTP_X_REQUESTED_WITH']) || strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) != 'xmlhttprequest') {
//    header('HTTP/1.1 400 Bad Request', true, 400);
//    exit();
//}

//check to see that the GET params are all there and that they are all numeric
if (empty($_GET["hours"]) || empty($_GET["cores"]) || empty($_GET["jobs"]) || empty($_GET["gcrmins"]) || 
    !is_numeric($_GET["hours"]) || !is_numeric($_GET["cores"]) || !is_numeric($_GET["jobs"]) || !is_numeric($_GET["gcrmins"])) {
    
    header('HTTP/1.1 400 Bad Request', true, 400);
    exit();
}



$jobWalltime = (int) $_GET["hours"];
$coresPerJob = (int) $_GET["cores"];
$numberOfJobs = (int) $_GET["jobs"];
$limit = (int) $_GET["gcrmins"];

// TODO change the timestep to be in minutes at the start
$timestep = 1;
$factory = new SimulationFactory();
$simulation = $factory->make($coresPerJob, $jobWalltime, $numberOfJobs, $timestep, $limit);

$output = array("data" => iterator_to_array($simulation));
echo json_encode($output);