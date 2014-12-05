var dataset = [];
var traits = [];

var vis1;
var vis2;
var brush1; // For 1st canvas
var brush_container1;
var brush2; // For 2nd canvas
var brush_container2;
var nSize; // Number of columns inputted in CSV file

// Set some dynamic dimensions and scale axis
var w=$("#plots").width() / 2 - 15;
var h=$("#iview").height();
var padding = 50;

var xScale_1=d3.scale.linear().range([padding,w-padding/2]);
var xScale_2=d3.scale.linear().range([padding,w-padding/2]);
var yScale_1=d3.scale.linear().range([h-padding,padding/2]);
var yScale_2=d3.scale.linear().range([h-padding,padding/2]);

var xAxis_1 = d3.svg.axis().scale(xScale_1).orient("bottom").ticks(5);
var yAxis_1 = d3.svg.axis().scale(yScale_1).orient("left").ticks(10);
var xAxis_2 = d3.svg.axis().scale(xScale_2).orient("bottom").ticks(5);
var yAxis_2 = d3.svg.axis().scale(yScale_2).orient("left").ticks(10);

// Rescale axis to a new set of data
function rescale_axis(axis,column){
    axis.domain([0, d3.max(dataset,function(d){return d[column]})]);
}

// Add variables to the drop-down box
function AddVariable(){

    // Grab the form input
    var userInput=$("#transform_name").val();
    var chosenFunc=$("#transform_op").val();
    var chosenVar=$("#transform_var").val();

    // Calculate the transform
    dataset.forEach(function(d){

        var newVal = d[chosenVar];

        // Log transform
        if (chosenFunc == 1){
            newVal = Math.log(newVal > 0 ? Math.abs(newVal) : 0);
        }

        // Square root transform
        else if(chosenFunc == 2){
            newVal = Math.sqrt(newVal > 0 ? Math.abs(newVal) : 0);
        }

        // Absolute value transform
        else if(chosenFunc == 3){
            newVal = Math.abs(newVal);
        }

        // Splice the new value into the dataset
        d.splice(nSize,0,newVal);
    })

    // Push the new variable into the trait list
    traits.push(userInput);
    var newOpt = $("<option></option>").attr("value",traits.length-1).text(userInput);
    $("[id^=opts]").append(newOpt);
    $("#transform_var").append(newOpt);

    // Update the number of traits counter
    nSize=traits.length;

    // Show the alert
    $("#transform_alert").toggleClass("hidden");
    setTimeout(function(){$("#transform_alert").toggleClass("hidden")},4000);
}

// Create a placeholder table for the summary properties
function setup_summary(){
    var def_list = $("<dl></dl>").addClass("dl-horizontal");
    for (trait in traits){
        var term = $("<dt></dt>").text(traits[trait]);
        var val = $("<dd></dd>").attr("id","trait"+trait);
        def_list.append(term);
        def_list.append(val);
    }
    $("#summary").append(def_list);
}

// Populate the summary box with proper summary statistics
function populate_summary(){
    
    // Initialize the summary table
    var summaries = [];
    var num_selected = 0;
    for (trait in traits){
        if(trait > 0){
            summaries[trait] = 0;
        }else{
            summaries[trait] = [];
        }
    }

    // If nothing is selected then summarize all
    select_all = !dataset.some(function(d){return d[nSize]});

    // Add up all the values
    dataset.forEach(function(d){
        if(select_all || d[nSize]){
            num_selected++;
            for(trait in traits){
                if(trait > 0){
                    summaries[trait] += d[trait];
                }else{
                    summaries[trait].push(d[trait]);
                }
            }
        }
    })

    // Take an average
    for (trait in traits){
        if(trait > 0){
            summaries[trait] = summaries[trait] / num_selected;
        }
    }

    // Cleaner text
    if(select_all){
        summaries[0] = "All";
    }else{
        summaries[0] = summaries[0].join(" ");
    }
    
    // Append the value to the right box
    for (trait in traits){
        $("#trait"+trait).text(trait > 0 ? summaries[trait].toFixed(2) : summaries[trait]);
    }
}


// Redraw 1st canvas from dropdown box !!
function PutOnCanvas1(){
    var selopt_1_can1=document.getElementById("opts1_1").value;
    var selopt_2_can1=document.getElementById("opts1_2").value;
    reDrawVis1(selopt_1_can1,selopt_2_can1);
}

// Redraw 2nd canvas from dropdown box
function PutOnCanvas2(){
    var selopt_1_can2=document.getElementById("opts2_1").value;
    var selopt_2_can2=document.getElementById("opts2_2").value;
    reDrawVis2(selopt_1_can2,selopt_2_can2);
}

// Parse the CSV file and populate the global dataset
function load_dataset(csv){
    var data = d3.csv.parse(csv);

    traits = d3.keys(data[0]);
    for (var i=0; i<traits.length; i++){
        d3.select("#opts1_1").append("option").text(traits[i]).attr("value",i);
        d3.select("#opts1_2").append("option").text(traits[i]).attr("value",i);
        d3.select("#opts2_1").append("option").text(traits[i]).attr("value",i);
        d3.select("#opts2_2").append("option").text(traits[i]).attr("value",i);
        d3.select("#transform_var").append("option").text(traits[i]).attr("value",i);
    }
    nSize = traits.length;

    last_trait_plotted = traits.length > 2 ? 2 : 1;

    d3.select("#opts1_1 option[value='0']").node().selected=true;
    d3.select("#opts1_2 option[value='1']").node().selected=true;
    d3.select("#opts2_1 option[value='0']").node().selected=true;
    d3.select("#opts2_2 option[value='" + last_trait_plotted + "']").node().selected=true;

    data.forEach(function(d){
        var point = d3.values(d).map(parseFloat);
        point.push(false);
        dataset.push(point);
    });

   // Draw the initial plots
   reDrawVis1(0,1);
   reDrawVis2(0,last_trait_plotted);

   // Create the summary view
   setup_summary();
   populate_summary();
}

// Reset the old view
function reset_view(){
    dataset = [];
    d3.selectAll("circle").classed("selected",false);
    $("[id^=opts]").empty();
    $("#transform_var").empty();
    $("#summary").empty();
    clearHighlight3D();
}

// Highlight points when cliked on by mouse
function click_select(d){

    if (!d[nSize]){
        dataset.forEach(function(d){d[nSize]=false});
        d[nSize]=true;
        d3.select("#plot1").selectAll("circle").classed("selected",function(d){
            if (d[nSize] == true){return true;}
            else {return false;}
        })

        d3.select("#plot2").selectAll("circle").classed("selected",function(d){
            if (d[nSize] == true){return true;}
            else {return false;}
        })

        // Highlight the residue on the 3D structure
        highlight_residues();

        // Update the data summary
        populate_summary();
    }

    else {
        d3.selectAll(".selected").classed("selected",false);
        d[nSize]=false;
    }
}

// Color the circles which are within the brushed box for 1st canvas
function brushmove_1(column1,column2){
    brush_container2.call(brush2.clear());

    var e = brush1.extent();
    dataset.forEach(function(d){d[nSize]=false});

    d3.select("#plot1")
        .selectAll("circle")
        .classed("selected",function(d){
            if (e[0][0] <= d[column1] && 
                d[column1] <= e[1][0] && 
                e[0][1] <= d[column2] && 
                d[column2] <= e[1][1]) {
                    d[nSize]=true;
                    return true}
            else {return false}
        })

    d3.select("#plot2")
        .selectAll("circle")
        .classed("selected",function(d){
            if (d[nSize]==true) {return true} 
            else {return false}
        })

    populate_summary();
}

// Brush function for 2nd canvas
function brushmove_2(column1,column2){
    brush_container1.call(brush1.clear());

    var e = brush2.extent();
    dataset.forEach(function(d){d[nSize]=false});

    var selected = [];

    d3.select("#plot2")
        .selectAll("circle")
        .classed("selected",function(d){
            if (e[0][0] <= d[column1] &&
                d[column1] <= e[1][0] && 
                e[0][1] <= d[column2] && 
                d[column2] <= e[1][1]) {
                    d[nSize]=true;
                    return true}
            else {return false}
        })
        
    d3.select("#plot1")
        .selectAll("circle")
        .classed("selected",function(d){
            if (d[nSize]==true) {return true}
            else {return false}
        })
}

// Highlight residues on the 3D vis
function highlight_residues(){
    var selected = [];
    dataset.forEach(function(d){
        if(d[nSize]){
            selected.push(d[0]);
        }
    })

    highlight3D(selected);
}

// Append appropriate canvases to the DOM for vis1
function setup_vis1(){
    vis1=d3.select("#plot1")
            .append("svg")
            .attr("width",w)
            .attr("height",h);

    vis1.append("text")
        .attr("x",-h/2)
        .attr("y",15)
        .attr("transform","rotate(-90)")
        .attr("id","ylab_1");

    vis1.append("text")
        .attr("x",w/2)
        .attr("y",h-15)
        .attr("id","xlab_1");

    vis1.insert("g")
        .attr("class","y axis");

    vis1.insert("g")
        .attr("class","x axis");

    brush1 = d3.svg.brush()
            .x(xScale_1)
            .y(yScale_1);

    brush_container1 = vis1.append("g")
                            .attr("class","brush")
                            .call(brush1); // Use vis1 !!
}

// Append appropriate canvases to the DOM for vis2
function setup_vis2(){
    vis2=d3.select("#plot2")
            .append("svg")
            .attr("width",w)
            .attr("height",h);

    vis2.append("text")
        .attr("x",-h/2)
        .attr("y",15)
        .attr("transform","rotate(-90)")
        .attr("id","ylab_2");

    vis2.append("text")
        .attr("x",w/2)
        .attr("y",h-15)
        .attr("id","xlab_2");

    vis2.insert("g")
        .attr("class","y axis");

    vis2.insert("g")
        .attr("class","x axis");

    brush2 = d3.svg.brush()
                .x(xScale_2)
                .y(yScale_2);

    brush_container2 = vis2.append("g")
                            .attr("class","brush")
                            .call(brush2); // Use vis2 !!        
}

// Draw the new datapoints for vis1
function reDrawVis1(column1,column2){
    rescale_axis(xScale_1,column1);
    rescale_axis(yScale_1,column2);

    var dataPointX=vis1.selectAll("circle").data(dataset);

    dataPointX.enter().append("circle");
    dataPointX.exit().remove();

    dataPointX
        .attr("cx",function(d) {return xScale_1(d[column1])})
        .attr("cy",function(d){return yScale_1(d[column2])})
        .attr("r",function(d) {return 3})
        .classed("regular",true)
        .on("click",click_select);
    
    d3.select("#xlab_1").text(traits[column1]);
    d3.select("#ylab_1").text(traits[column2]);

    vis1.selectAll(".x.axis")
        .attr("transform","translate(0,"+(h-padding)+")")
        .call(xAxis_1);

    vis1.select(".y.axis")
        .attr("transform","translate("+padding+",0)")
        .call(yAxis_1);

    brush1.clear();
    brush1.on("brush",function(d) {brushmove_1(column1,column2)});
    brush1.on("brushend",highlight_residues);
    brush_container1.call(brush1);
}

// Draw the new datapoints for vis2
function reDrawVis2(column1,column2){

    rescale_axis(xScale_2,column1);
    rescale_axis(yScale_2,column2);

    var dataPointX=vis2.selectAll("circle").data(dataset);

    dataPointX.enter().append("circle");
    dataPointX.exit().remove();

    dataPointX
        .attr("cx",function(d) {return xScale_2(d[column1])})
        .attr("cy",function(d){return yScale_2(d[column2])})
        .attr("r",function(d) {return 3})
        .classed("regular",true)
        .on("click",click_select);
    
    d3.select("#xlab_2").text(traits[column1]);
    d3.select("#ylab_2").text(traits[column2]);
    
    vis2.selectAll(".x.axis")
        .attr("transform","translate(0,"+(h-padding)+")")
        .call(xAxis_2);

    vis2.select(".y.axis")
        .attr("transform","translate("+padding+",0)")
        .call(yAxis_2);

    brush2.clear();
    brush2.on("brush",function(d) {brushmove_2(column1,column2)});
    brush2.on("brushend",highlight_residues);
    brush_container2.call(brush2);
}

// Attach a listener to the CSV uploader
$("#csvInput").change(function() {

    var file = this.files[0];
    if (file === undefined) return;

    var reader = new FileReader();
    reader.onload = function () {

        //Reset the current visualization
        reset_view();

        // Load in the new CSV dataset
        load_dataset(reader.result);
    };
    reader.readAsText(file);
});

// Initialize the plots
setup_vis1();
setup_vis2();

// Assign canvas changes to replot
$("[id^=opts1").change(PutOnCanvas1);
$("[id^=opts2").change(PutOnCanvas2);

// Assign thransform changes to apply the transform
$("#transform_apply").click(AddVariable);
